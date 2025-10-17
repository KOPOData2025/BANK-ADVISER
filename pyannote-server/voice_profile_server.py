#!/usr/bin/env python3
"""
Voice Profile 기반 화자 분리 서버 (5005 포트)
- voice_profiles 테이블의 행원 목소리와 비교하여 정확도 향상
- 행원 목소리와 일치하는 경우만 'employee'로 분류
- 나머지는 모두 'customer'로 분류
"""

import os
import sys
import json
import logging
import requests
import librosa
from scipy.io import wavfile as scipy_wavfile
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import joblib
import subprocess
import shutil
from sklearn.metrics.pairwise import cosine_similarity
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import base64

# Optional: Whisper transcription for overlap
whisper_model = None
try:
    from faster_whisper import WhisperModel  # type: ignore
except Exception:
    WhisperModel = None  # Lazy import fallback

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Supabase 설정
SUPABASE_URL = "https://jhfjigeuxrxxbbsoflcd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ"

# 전역 변수
voice_profiles = {}
custom_classifier = None
label_mapping = {}
pyannote_model = None

def load_voice_profiles():
    """Supabase에서 voice_profiles 데이터 로드"""
    global voice_profiles
    
    try:
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"🔍 Supabase 요청: {SUPABASE_URL}/rest/v1/voice_profiles")
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/voice_profiles",
            headers=headers
        )
        
        logger.info(f"📡 응답 상태: {response.status_code}")
        logger.info(f"📄 응답 내용: {response.text[:500]}...")
        
        if response.status_code == 200:
            profiles = response.json()
            voice_profiles = {}
            
            for profile in profiles:
                employee_id = profile.get('employee_id')
                audio_url = profile.get('audio_file_url')
                confidence = float(profile.get('confidence_score', 0.9))
                
                if employee_id and audio_url:
                    voice_profiles[employee_id] = {
                        'audio_url': audio_url,
                        'confidence': confidence,
                        'employee_name': profile.get('employee_name', 'Unknown')
                    }
            
            logger.info(f"✅ Voice profiles 로드 완료: {len(voice_profiles)}개")
            for emp_id, profile in voice_profiles.items():
                logger.info(f"  - {emp_id}: {profile['employee_name']} (신뢰도: {profile['confidence']})")
            
            return True
        else:
            logger.error(f"❌ Voice profiles 로드 실패: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Voice profiles 로드 중 오류: {str(e)}")
        return False

def initialize_custom_model():
    """커스텀 모델 초기화"""
    global custom_classifier, label_mapping, pyannote_model
    
    try:
        # 모델 파일 경로 설정 (EC2 친화적 경로 + 환경변수 오버라이드 지원)
        base_dir = os.getenv(
            "CUSTOM_MODEL_DIR",
            os.path.join(os.path.dirname(__file__), "second_train")
        )
        model_path = os.path.join(base_dir, "speaker_role_classifier.joblib")
        label_path = os.path.join(base_dir, "label_mapping.json")
        
        if os.path.exists(model_path) and os.path.exists(label_path):
            custom_classifier = joblib.load(model_path)
            
            with open(label_path, 'r', encoding='utf-8') as f:
                label_mapping = json.load(f)
            
            # pyannote.audio 모델 초기화 (학습된 분류기 사용을 위해)
            try:
                from pyannote.audio import Model
                pyannote_model = Model.from_pretrained("pyannote/embedding", use_auth_token=os.getenv("HUGGINGFACE_TOKEN"))
                logger.info("✅ pyannote.audio 모델 로드 완료")
            except Exception as e:
                logger.warning(f"⚠️ pyannote.audio 모델 로드 실패: {e}")
                pyannote_model = None
            
            logger.info("✅ 커스텀 분류기 로드 완료")
            logger.info(f"✅ 라벨 매핑 로드 완료: {label_mapping}")
            return True
        else:
            logger.info("ℹ️ 커스텀 모델 파일이 없습니다. Voice Profile 기반 분류만 사용합니다.")
            custom_classifier = None
            label_mapping = {}
            pyannote_model = None
            return True
            
    except Exception as e:
        logger.error(f"❌ 커스텀 모델 초기화 실패: {str(e)}")
        return False

def extract_audio_features(audio_url):
    """오디오 URL에서 특징 추출 (scipy로 로드 → librosa로 MFCC)"""
    temp_file = None
    temp_wav = None
    try:
        logger.info(f"🎵 오디오 특징 추출 시작: {audio_url}")

        # 오디오 파일 다운로드
        response = requests.get(audio_url, timeout=15)
        if response.status_code != 200:
            logger.error(f"❌ 오디오 다운로드 실패: {response.status_code}")
            return None

        # 임시 파일로 저장
        temp_file = "/tmp/temp_audio.wav"
        with open(temp_file, 'wb') as f:
            f.write(response.content)

        logger.info(f"📁 임시 파일 저장 완료: {temp_file}")

        # 먼저 WAV로 가정하고 scipy로 로드 시도
        try:
            sr_native, y = scipy_wavfile.read(temp_file)
            logger.info(f"🎵 scipy 로드 완료: dtype={getattr(y, 'dtype', None)}, shape={getattr(y, 'shape', None)}, sr={sr_native}")
        except Exception as e:
            logger.warning(f"⚠️ 직접 WAV 로드 실패, ffmpeg 변환 시도: {str(e)}")
            # 파일이 WebM/Opus 등인 경우 ffmpeg로 PCM WAV 변환
            if shutil.which('ffmpeg') is None:
                logger.error("❌ ffmpeg 미설치 - 비WAV 파일 변환 불가")
                return None
            temp_wav = "/tmp/temp_converted.wav"
            try:
                cmd = [
                    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                    '-i', temp_file,
                    '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav
                ]
                subprocess.run(cmd, check=True)
                sr_native, y = scipy_wavfile.read(temp_wav)
                logger.info(f"🎵 ffmpeg 변환 후 로드 완료: dtype={getattr(y, 'dtype', None)}, shape={getattr(y, 'shape', None)}, sr={sr_native}")
            except subprocess.CalledProcessError as ce:
                logger.error(f"❌ ffmpeg 변환 실패: {str(ce)}")
                return None

        # 유효성 검사
        if y is None:
            logger.error("❌ 오디오 데이터가 비어 있습니다")
            return None

        # 스테레오 → 모노
        if hasattr(y, 'ndim') and y.ndim == 2:
            y = y.mean(axis=1)

        # 정수형을 float32 [-1, 1]로 정규화
        if np.issubdtype(y.dtype, np.integer):
            max_val = np.iinfo(y.dtype).max
            if max_val == 0:
                logger.error("❌ 오디오 정규화 실패: max_val=0")
                return None
            y = y.astype(np.float32) / max_val
        else:
            y = y.astype(np.float32)

        # 리샘플링 (필요 시)
        target_sr = 16000
        if sr_native != target_sr:
            y = librosa.resample(y, orig_sr=sr_native, target_sr=target_sr)
            sr = target_sr
        else:
            sr = sr_native

        logger.info(f"🎼 신호 준비 완료: 길이={len(y)}, sr={sr}")

        # 최소 길이 체크 (짧은 신호는 MFCC 불가)
        if len(y) < sr * 0.2:  # 200ms 미만이면 스킵
            logger.warning("⚠️ 오디오가 너무 짧아 MFCC 추출 불가")
            return None

        # MFCC 추출
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfccs_mean = np.mean(mfccs, axis=1)

        logger.info(f"🎯 MFCC 특징 추출 완료: {len(mfccs_mean)} 차원")
        return mfccs_mean

    except Exception as e:
        logger.error(f"❌ 오디오 특징 추출 실패: {str(e)}")
        return None
    finally:
        try:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)
            if temp_wav and os.path.exists(temp_wav):
                os.remove(temp_wav)
        except Exception:
            pass

def extract_pyannote_embedding(audio_file_path: str) -> Optional[np.ndarray]:
    """WAV 파일에서 pyannote.audio 임베딩 추출 (학습된 분류기용)"""
    global pyannote_model
    
    if pyannote_model is None:
        logger.warning("⚠️ pyannote.audio 모델이 로드되지 않음")
        return None
    
    try:
        import torch
        import soundfile as sf
        
        # 오디오 로드
        audio, sr = sf.read(audio_file_path)
        
        # 1초 미만의 짧은 오디오는 건너뛰기
        if len(audio) < sr:
            logger.warning("⚠️ 오디오가 너무 짧음 (1초 미만)")
            return None
        
        # 스테레오 → 모노
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
        
        # torch 텐서로 변환
        waveform = torch.tensor(audio, dtype=torch.float32).unsqueeze(0)
        
        # pyannote.audio 임베딩 추출
        with torch.no_grad():
            embedding = pyannote_model(waveform).squeeze(0).cpu().numpy()
        
        logger.info(f"🎯 pyannote.audio 임베딩 추출 완료: {len(embedding)} 차원")
        return embedding
        
    except Exception as e:
        logger.error(f"❌ pyannote.audio 임베딩 추출 실패: {str(e)}")
        return None

def extract_audio_features_from_base64(audio_base64: str, mime: Optional[str] = None):
    """클라이언트에서 보내온 base64 오디오(webm 등)를 WAV로 변환 후 MFCC 추출"""
    temp_src = None
    temp_wav = None
    try:
        if not audio_base64:
            return None
        if shutil.which('ffmpeg') is None:
            logger.error("❌ ffmpeg 미설치 - base64 오디오 변환 불가")
            return None

        # 디코드하여 임시 소스 파일로 저장 (webm/ogg/opus 등)
        raw = base64.b64decode(audio_base64)
        ext = 'webm'
        if mime and 'ogg' in mime:
            ext = 'ogg'
        temp_src = f"/tmp/snippet_src.{ext}"
        with open(temp_src, 'wb') as f:
            f.write(raw)

        # ffmpeg로 16kHz mono WAV 변환
        temp_wav = "/tmp/snippet_conv.wav"
        cmd = [
            'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
            '-i', temp_src,
            '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav
        ]
        subprocess.run(cmd, check=True)

        # WAV 로드
        sr_native, y = scipy_wavfile.read(temp_wav)
        if hasattr(y, 'ndim') and y.ndim == 2:
            y = y.mean(axis=1)
        if np.issubdtype(y.dtype, np.integer):
            max_val = np.iinfo(y.dtype).max
            if max_val == 0:
                return None
            y = y.astype(np.float32) / max_val
        else:
            y = y.astype(np.float32)

        sr = sr_native
        if sr != 16000:
            y = librosa.resample(y, orig_sr=sr, target_sr=16000)
            sr = 16000

        if len(y) < sr * 0.2:
            logger.warning("⚠️ base64 오디오가 너무 짧아 MFCC 추출 불가")
            return None

        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfccs_mean = np.mean(mfccs, axis=1)
        return mfccs_mean
    except Exception as e:
        logger.error(f"❌ base64 오디오 특징 추출 실패: {str(e)}")
        return None
    finally:
        try:
            if temp_src and os.path.exists(temp_src):
                os.remove(temp_src)
            if temp_wav and os.path.exists(temp_wav):
                os.remove(temp_wav)
        except Exception:
            pass

def calculate_voice_similarity(audio_features1, audio_features2):
    """두 오디오 특징 간의 유사도 계산"""
    try:
        if audio_features1 is None or audio_features2 is None:
            return 0.0
            
        # 코사인 유사도 계산
        similarity = cosine_similarity([audio_features1], [audio_features2])[0][0]
        return float(similarity)
        
    except Exception as e:
        logger.error(f"❌ 유사도 계산 실패: {str(e)}")
        return 0.0

def classify_speaker_by_voice(transcript, audio_features=None, employee_voice_profile=None):
    """음성 특징 기반 화자 분류"""
    global voice_profiles
    
    logger.info(f"🔍 음성 기반 분류 시작 - audio_features: {audio_features is not None}, employee_voice_profile: {employee_voice_profile is not None}")
    
    if not voice_profiles:
        logger.info("⚠️ Voice profiles 없음 - 텍스트 기반 분류로 폴백")
        text_result = classify_speaker_by_text(transcript)
        text_result.update({
            'similarity': 0.0,
            'decision_reason': 'text_no_profiles',
            'overlap': False
        })
        return text_result
    
    # 실제 음성 데이터가 있으면 MFCC 특징 추출 시도
    if audio_features is None and employee_voice_profile:
        try:
            logger.info("🎵 음성 특징 추출 시도...")
            audio_features = extract_audio_features(employee_voice_profile.get('audio_file_url'))
            if audio_features is not None:
                logger.info(f"✅ 음성 특징 추출 성공: {len(audio_features)} 차원")
            else:
                logger.warning("❌ 음성 특징 추출 실패")
        except Exception as e:
            logger.error(f"❌ 음성 특징 추출 중 오류: {str(e)}")
    
    if audio_features is None:
        logger.info("⚠️ 음성 특징 없음 - 텍스트 기반 분류로 폴백")
        text_result = classify_speaker_by_text(transcript)
        text_result.update({
            'similarity': 0.0,
            'decision_reason': 'text_no_features',
            'overlap': False
        })
        return text_result
    
    best_match = None
    best_similarity = 0.0
    similarity_threshold = 0.7  # 유사도 임계값
    secondary = None
    secondary_similarity = 0.0
    
    # 각 행원의 음성 프로필과 비교
    for employee_id, profile in voice_profiles.items():
        try:
            # 행원 음성 특징 추출
            employee_features = extract_audio_features(profile['audio_url'])
            
            if employee_features is not None:
                # 유사도 계산
                similarity = calculate_voice_similarity(audio_features, employee_features)
                
                logger.info(f"🔍 {employee_id} ({profile['employee_name']}) 유사도: {similarity:.3f}")
                
                # best, secondary 추적
                if similarity > best_similarity:
                    secondary, secondary_similarity = best_match, best_similarity
                    best_similarity = similarity
                    best_match = {
                        'employee_id': employee_id,
                        'employee_name': profile['employee_name'],
                        'similarity': similarity
                    }
                elif similarity > secondary_similarity:
                    secondary = {
                        'employee_id': employee_id,
                        'employee_name': profile['employee_name'],
                        'similarity': similarity
                    }
                    secondary_similarity = similarity
        
        except Exception as e:
            logger.error(f"❌ {employee_id} 음성 비교 실패: {str(e)}")
            continue
    
    # 기본 overlap 감지: 경계 구간(0.65~0.80)에서 겹침 플래그만 표시
    overlap = False
    decision_reason = 'voice'
    if 0.65 <= best_similarity < 0.80:
        overlap = True
        decision_reason = 'voice_overlap_threshold'
    
    if best_match and best_similarity > similarity_threshold:
        logger.info(f"✅ 음성 매칭 성공: {best_match['employee_name']} (유사도: {best_match['similarity']:.3f})")
        return {
            'speaker_id': f"speaker_{best_match['employee_id']}",
            'speaker_name': 'employee',
            'confidence': best_similarity,
            'employee_id': best_match['employee_id'],
            'employee_name': best_match['employee_name'],
            'similarity': best_similarity,
            'decision_reason': decision_reason,
            'overlap': overlap,
            'secondary_speaker': None if not overlap else 'customer'
        }
    else:
        logger.info("👤 음성 매칭 실패 - 고객으로 분류")
        return {
            'speaker_id': 'speaker_customer',
            'speaker_name': 'customer',
            'confidence': max(0.7, 1.0 - best_similarity),
            'employee_id': None,
            'employee_name': None,
            'similarity': best_similarity,
            'decision_reason': 'voice_no_match',
            'overlap': overlap,
            'secondary_speaker': None
        }

def classify_speaker_by_pyannote_embedding(audio_file_path: str) -> dict:
    """pyannote.audio 임베딩으로 학습된 분류기 사용"""
    global custom_classifier, label_mapping
    
    if not custom_classifier or not label_mapping:
        logger.warning("⚠️ 학습된 분류기가 없음")
        return None
    
    try:
        # pyannote.audio 임베딩 추출
        embedding = extract_pyannote_embedding(audio_file_path)
        if embedding is None:
            logger.warning("⚠️ pyannote.audio 임베딩 추출 실패")
            return None
        
        # 학습된 분류기로 예측
        prediction = custom_classifier.predict([embedding])[0]
        
        # 라벨 매핑에서 화자 이름 찾기
        speaker_name = None
        for name, label in label_mapping.items():
            if label == prediction:
                speaker_name = name
                break
        
        if speaker_name:
            # 예측 확률도 함께 계산
            prediction_proba = custom_classifier.predict_proba([embedding])[0]
            max_confidence = float(np.max(prediction_proba))
            
            logger.info(f"🎯 학습된 분류기 예측 결과: {speaker_name} (신뢰도: {max_confidence:.3f})")
            
            # 신뢰도가 0.8 이상일 때만 사용, 그렇지 않으면 None 반환하여 폴백
            if max_confidence >= 0.8:
                return {
                    'speaker_id': f"speaker_{speaker_name}",
                    'speaker_name': speaker_name,
                    'confidence': max_confidence,
                    'decision_reason': 'pyannote_classifier',
                    'similarity': max_confidence,
                    'overlap': False
                }
            else:
                logger.info(f"🔄 학습된 분류기 신뢰도 낮음 ({max_confidence:.3f} < 0.8), 폴백으로 전환")
                return None
        else:
            logger.warning("⚠️ 예측 결과를 라벨 매핑에서 찾을 수 없음")
            return None
            
    except Exception as e:
        logger.error(f"❌ pyannote.audio 분류기 예측 실패: {str(e)}")
        return None

def classify_speaker_by_text(transcript):
    """텍스트 기반 화자 분류 (폴백)"""
    global custom_classifier, label_mapping
    
    # 텍스트 전처리
    text = transcript.lower().strip()
    
    # 행원 특화 키워드 패턴 (더 구체적으로)
    employee_patterns = [
        r'\b(안녕하세요|어서오세요|도와드리겠습니다|감사합니다|죄송합니다)\b',
        r'\b(고객님|말씀|궁금|문의|상담)\b',
        r'\b(추천|설명|안내|확인|검토)\b',
        r'\b(시뮬레이션|계산|예상|예시)\b',
        r'\b(다음|단계|진행|완료|종료)\b',
        r'\b(어떤.*상품|관심.*있으신|도와드릴까요|보여드리겠습니다)\b',
        r'\b(맞는.*상품|추천드리겠습니다|설명드리겠습니다)\b',
        r'\b(서류.*준비|도와드리겠습니다|궁금한.*점)\b',
        r'\b(우대.*조건|혜택.*설명|금리.*안내)\b',
        r'\b(어서.*오세요|환영합니다|어떻게.*도와드릴까요)\b',
        r'\b(상품.*추천|맞는.*상품|적합한.*상품)\b',
        r'\b(도와드릴까요|도와드리겠습니다|도와드릴게요)\b',
        r'\b(보여드리겠습니다|보여드릴게요|보여드릴까요)\b',
        r'\b(설명드리겠습니다|설명드릴게요|설명드릴까요)\b',
        r'\b(안내드리겠습니다|안내드릴게요|안내드릴까요)\b'
    ]
    
    # 고객 특화 키워드 패턴
    customer_patterns = [
        r'\b(궁금|문의|질문|알고싶|궁금해)\b',
        r'\b(가입하고싶|신청하고싶|하고싶어)\b',
        r'\b(어떤|무엇|언제|어디|얼마|왜|어떻게)\b',
        r'\b(좋은|나쁜|괜찮|맞나|맞지)\b',
        r'\b(도와주|알려주|설명해주|보여주)\b',
        r'\b(비교|차이|장점|단점|장단점)\b',
        r'\b(추천해주|추천받|추천하고싶)\b',
        r'\b(신청|가입|해지|변경|수정)\b'
    ]
    
    # 패턴 매칭 점수 계산
    employee_score = 0
    customer_score = 0
    
    for pattern in employee_patterns:
        if re.search(pattern, text):
            employee_score += 1
    
    for pattern in customer_patterns:
        if re.search(pattern, text):
            customer_score += 1
    
    # 커스텀 모델이 있으면 사용
    if custom_classifier and label_mapping:
        try:
            # 간단한 특징 벡터 생성 (텍스트 길이, 키워드 개수 등)
            features = np.array([
                len(text),
                employee_score,
                customer_score,
                text.count('?'),
                text.count('!'),
                text.count('.')
            ]).reshape(1, -1)
            
            prediction = custom_classifier.predict(features)[0]
            # 실제 유사도 기반으로 신뢰도 계산
            if best_match and best_similarity > 0:
                confidence = min(0.99, max(0.7, best_similarity))  # 0.7~0.99 범위로 제한
            else:
                confidence = 0.8  # 기본값
            
            # 라벨 매핑에서 화자 이름 찾기
            speaker_name = None
            for name, label in label_mapping.items():
                if label == prediction:
                    speaker_name = name
                    break
            
            if speaker_name:
                return {
                    'speaker_id': f"speaker_{speaker_name}",
                    'speaker_name': speaker_name,
                    'confidence': confidence
                }
                
        except Exception as e:
            logger.error(f"❌ 커스텀 모델 예측 실패: {str(e)}")
    
    # 규칙 기반 분류
    if employee_score > customer_score:
        return {
            'speaker_id': 'speaker_employee',
            'speaker_name': 'employee',
            'confidence': 0.7
        }
    else:
        return {
            'speaker_id': 'speaker_customer',
            'speaker_name': 'customer',
            'confidence': 0.7
        }

def ensure_whisper_model():
    global whisper_model, WhisperModel
    if whisper_model is not None:
        return whisper_model
    if WhisperModel is None:
        logger.warning("⚠️ faster-whisper 미설치 - 겹침 구간 STT 비활성")
        return None
    try:
        # small / base 선택 가능. 성능-속도 균형을 위해 small 사용.
        whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
        logger.info("✅ faster-whisper 모델 로드 완료")
        return whisper_model
    except Exception as e:
        logger.error(f"❌ faster-whisper 로드 실패: {e}")
        whisper_model = None
        return None


def transcribe_snippet_from_base64(audio_base64: str, mime: Optional[str] = None) -> Optional[str]:
    """겹침 구간에 대해 base64 오디오를 Whisper로 전사.
    - ffmpeg로 16kHz mono WAV 변환 후 faster-whisper 사용
    """
    temp_src = None
    temp_wav = None
    try:
        if not audio_base64:
            return None
        if shutil.which('ffmpeg') is None:
            logger.error("❌ ffmpeg 미설치 - overlap 전사 불가")
            return None
        model = ensure_whisper_model()
        if model is None:
            return None

        # base64 → 임시 소스 파일
        raw = base64.b64decode(audio_base64)
        ext = 'webm'
        if mime and 'ogg' in mime:
            ext = 'ogg'
        temp_src = f"/tmp/overlap_src.{ext}"
        with open(temp_src, 'wb') as f:
            f.write(raw)

        # ffmpeg 변환
        temp_wav = "/tmp/overlap_conv.wav"
        cmd = [
            'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
            '-i', temp_src, '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav
        ]
        subprocess.run(cmd, check=True)

        # Whisper 전사
        segments, info = model.transcribe(temp_wav, language="ko", vad_filter=True)
        texts = []
        for seg in segments:
            if seg and getattr(seg, 'text', ''):
                texts.append(seg.text.strip())
        transcript = " ".join(texts).strip()
        logger.info(f"🗣️ overlap 전사 결과: {transcript[:80]}{'...' if len(transcript)>80 else ''}")
        return transcript if transcript else None
    except Exception as e:
        logger.error(f"❌ overlap 전사 실패: {e}")
        return None
    finally:
        try:
            if temp_src and os.path.exists(temp_src):
                os.remove(temp_src)
            if temp_wav and os.path.exists(temp_wav):
                os.remove(temp_wav)
        except Exception:
            pass

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        "model_type": "voice_profile_based",
        "status": "healthy",
        "voice_profiles_count": len(voice_profiles),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/process-transcript', methods=['POST'])
def process_transcript():
    """음성 인식 결과 처리"""
    try:
        # multipart/form-data와 JSON 모두 처리
        if request.content_type and 'multipart/form-data' in request.content_type:
            # multipart/form-data 처리
            audio_file = request.files.get('audio')
            employee_id = request.form.get('employee_id')
            
            if not audio_file:
                return jsonify({
                    'speaker_id': 'speaker_unknown',
                    'speaker_name': 'unknown',
                    'confidence': 0.0,
                    'similarity': 0.0,
                    'decision_reason': 'no_audio',
                    'overlap': False,
                    'error': 'No audio file provided'
                })
            
            # 오디오 파일을 base64로 변환
            audio_data = audio_file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            audio_mime = audio_file.content_type or 'audio/webm'
            
            # Whisper로 음성 인식
            transcript = transcribe_snippet_from_base64(audio_base64, audio_mime)
            if not transcript:
                transcript = "음성 인식 실패"
            
            logger.info(f"📝 음성 인식 결과: {transcript}")
            
            # 음성 특징 추출
            derived_features = extract_audio_features_from_base64(audio_base64, audio_mime)
            
            # WAV 파일로 변환해서 학습된 분류기 사용 시도
            temp_wav_path = None
            try:
                # base64 → 임시 WAV 파일
                raw = base64.b64decode(audio_base64)
                temp_src = f"/tmp/classifier_src.{audio_mime.split('/')[-1] if audio_mime else 'webm'}"
                with open(temp_src, 'wb') as f:
                    f.write(raw)
                
                # ffmpeg로 WAV 변환
                temp_wav_path = "/tmp/classifier_input.wav"
                cmd = [
                    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                    '-i', temp_src, '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav_path
                ]
                subprocess.run(cmd, check=True)
                
                # 학습된 분류기로 분류 시도
                pyannote_result = classify_speaker_by_pyannote_embedding(temp_wav_path)
                if pyannote_result:
                    logger.info("🎯 학습된 분류기 사용 성공")
                    result = pyannote_result
                else:
                    # 폴백: 기존 MFCC 기반 분류
                    logger.info("🔄 학습된 분류기 실패, MFCC 기반 분류로 폴백")
                    result = classify_speaker_by_voice(transcript, derived_features, None)
                
                # 임시 파일 정리
                if os.path.exists(temp_src):
                    os.remove(temp_src)
                if os.path.exists(temp_wav_path):
                    os.remove(temp_wav_path)
                    
            except Exception as e:
                logger.warning(f"⚠️ 학습된 분류기 사용 실패: {e}")
                # 폴백: 기존 MFCC 기반 분류
                result = classify_speaker_by_voice(transcript, derived_features, None)
            
        else:
            # JSON 처리 (기존 로직)
            data = request.get_json()
            logger.info(f"📝 받은 데이터: {data}")
            
            transcript = data.get('transcript', '').strip()
            audio_features = data.get('audio_features')  # 오디오 특징 (선택적)
            employee_voice_profile = data.get('employee_voice_profile')  # 행원 음성 프로필
            audio_base64 = data.get('audio_base64')
            audio_mime = data.get('audio_mime')
            derived_features = None
            
            if audio_base64:
                derived_features = extract_audio_features_from_base64(audio_base64, audio_mime)
                
                # WAV 파일로 변환해서 학습된 분류기 사용 시도
                temp_wav_path = None
                try:
                    # base64 → 임시 WAV 파일
                    raw = base64.b64decode(audio_base64)
                    temp_src = f"/tmp/classifier_src.{audio_mime.split('/')[-1] if audio_mime else 'webm'}"
                    with open(temp_src, 'wb') as f:
                        f.write(raw)
                    
                    # ffmpeg로 WAV 변환
                    temp_wav_path = "/tmp/classifier_input.wav"
                    cmd = [
                        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                        '-i', temp_src, '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav_path
                    ]
                    subprocess.run(cmd, check=True)
                    
                    # 학습된 분류기로 분류 시도
                    pyannote_result = classify_speaker_by_pyannote_embedding(temp_wav_path)
                    if pyannote_result:
                        logger.info("🎯 학습된 분류기 사용 성공")
                        result = pyannote_result
                    else:
                        # 폴백: 기존 MFCC 기반 분류
                        logger.info("🔄 학습된 분류기 실패, MFCC 기반 분류로 폴백")
                        result = classify_speaker_by_voice(transcript, derived_features, None)
                    
                    # 임시 파일 정리
                    if os.path.exists(temp_src):
                        os.remove(temp_src)
                    if os.path.exists(temp_wav_path):
                        os.remove(temp_wav_path)
                        
                except Exception as e:
                    logger.warning(f"⚠️ 학습된 분류기 사용 실패: {e}")
                    # 폴백: 기존 MFCC 기반 분류
                    result = classify_speaker_by_voice(transcript, derived_features, None)
            else:
                # 텍스트만 있는 경우
                result = classify_speaker_by_text(transcript)
                result.update({'similarity': 0.0, 'decision_reason': 'text_only', 'overlap': False})
        
        if not transcript:
            return jsonify({
                'speaker_id': 'speaker_unknown',
                'speaker_name': 'unknown',
                'confidence': 0.0,
                'similarity': 0.0,
                'decision_reason': 'no_transcript',
                'overlap': False,
                'error': 'No transcript provided'
            })
        
        # 겹침 표시된 경우, 가능한 경우 Whisper로 전사 시도
        if result.get('overlap') and audio_base64:
            overlap_txt = transcribe_snippet_from_base64(audio_base64, audio_mime)
            if overlap_txt:
                result['overlap_transcript'] = overlap_txt
                # 겹침이지만 텍스트가 있으면 그대로 제공
        
        logger.info(f"🎯 분류 결과: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ 처리 중 오류: {str(e)}")
        return jsonify({
            'speaker_id': 'speaker_unknown',
            'speaker_name': 'unknown',
            'confidence': 0.0,
            'similarity': 0.0,
            'decision_reason': 'error',
            'overlap': False,
            'error': str(e)
        }), 500

@app.route('/voice-profiles', methods=['GET'])
def get_voice_profiles():
    """현재 로드된 음성 프로필 정보 반환"""
    return jsonify({
        'profiles': voice_profiles,
        'count': len(voice_profiles)
    })

@app.route('/reload-profiles', methods=['POST'])
def reload_voice_profiles():
    """음성 프로필 다시 로드"""
    success = load_voice_profiles()
    return jsonify({
        'success': success,
        'count': len(voice_profiles) if success else 0
    })

if __name__ == '__main__':
    logger.info("🚀 Voice Profile 기반 화자 분리 서버 시작...")
    
    # 음성 프로필 로드
    if load_voice_profiles():
        logger.info("✅ Voice profiles 로드 성공")
    else:
        logger.warning("⚠️ Voice profiles 로드 실패 - 텍스트 기반 분류만 사용")
    
    # 커스텀 모델 초기화
    if initialize_custom_model():
        logger.info("✅ 커스텀 모델 초기화 성공")
    else:
        logger.info("ℹ️ 커스텀 모델 없음 - 텍스트 기반 분류만 사용")
    
    logger.info("✅ 서버 준비 완료")
    logger.info("📊 사용 모델: Voice Profile + 텍스트 기반 분류")
    logger.info("🎯 분류 대상: 행원 vs 고객 (음성 매칭 우선)")
    logger.info("🌐 서버 주소: http://localhost:5005")
    
    app.run(host='0.0.0.0', port=5005, debug=True)
