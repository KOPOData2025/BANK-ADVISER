#!/usr/bin/env python3
"""
Supabase 기반 음성 프로필 관리 시스템
행원의 음성 특성을 Supabase에 저장하고 화자 분리에 활용
"""

import os
import json
import numpy as np
import librosa
import soundfile as sf
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

@dataclass
class VoiceProfile:
    """음성 프로필 데이터 클래스"""
    employee_id: str
    employee_name: str
    voice_embedding: List[float]  # 음성 임베딩 벡터
    pitch_mean: float
    pitch_std: float
    spectral_centroid_mean: float
    spectral_centroid_std: float
    mfcc_features: List[float]  # MFCC 특성
    zero_crossing_rate: float
    energy_mean: float
    energy_std: float
    recording_duration: float
    sample_rate: int
    created_at: str
    updated_at: str
    confidence_score: float

class SupabaseVoiceProfileManager:
    """Supabase 기반 음성 프로필 관리자"""
    
    def __init__(self):
        # Supabase 클라이언트 초기화
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            print("⚠️ Supabase 설정이 없습니다. 기본 로컬 모드로 실행됩니다.")
            self.supabase = None
        else:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            print("✅ Supabase 클라이언트 초기화 완료")
    
    def extract_voice_features(self, audio_file_path: str) -> Dict:
        """음성 파일에서 특성 추출"""
        try:
            # 오디오 로드
            y, sr = librosa.load(audio_file_path, sr=16000)
            
            # 기본 특성 추출
            features = {}
            
            # 1. 음높이 (Pitch) 분석
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            features['pitch_mean'] = float(np.mean(pitch_values)) if pitch_values else 0.0
            features['pitch_std'] = float(np.std(pitch_values)) if pitch_values else 0.0
            
            # 2. 스펙트럴 센트로이드 (음색)
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
            features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            
            # 3. MFCC (음성 인식 특성)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            features['mfcc_features'] = np.mean(mfccs, axis=1).tolist()
            
            # 4. 제로 크로싱 레이트 (음성 활성도)
            features['zero_crossing_rate'] = float(np.mean(librosa.feature.zero_crossing_rate(y)[0]))
            
            # 5. 에너지 (음량)
            energy = librosa.feature.rms(y=y)[0]
            features['energy_mean'] = float(np.mean(energy))
            features['energy_std'] = float(np.std(energy))
            
            # 6. 음성 임베딩 (간단한 통계 기반)
            voice_embedding = [
                features['pitch_mean'],
                features['pitch_std'],
                features['spectral_centroid_mean'],
                features['spectral_centroid_std'],
                features['zero_crossing_rate'],
                features['energy_mean'],
                features['energy_std']
            ] + features['mfcc_features']
            
            features['voice_embedding'] = voice_embedding
            features['recording_duration'] = float(len(y) / sr)
            features['sample_rate'] = int(sr)
            
            return features
            
        except Exception as e:
            print(f"❌ 음성 특성 추출 실패: {e}")
            return {}
    
    def save_voice_profile(self, employee_id: str, employee_name: str, 
                          audio_file_path: str) -> bool:
        """행원 음성 프로필 저장"""
        try:
            # 음성 특성 추출
            features = self.extract_voice_features(audio_file_path)
            if not features:
                return False
            
            # 음성 프로필 데이터 준비
            profile_data = {
                'employee_id': employee_id,
                'employee_name': employee_name,
                'voice_embedding': json.dumps(features['voice_embedding']),
                'pitch_mean': features['pitch_mean'],
                'pitch_std': features['pitch_std'],
                'spectral_centroid_mean': features['spectral_centroid_mean'],
                'spectral_centroid_std': features['spectral_centroid_std'],
                'mfcc_features': json.dumps(features['mfcc_features']),
                'zero_crossing_rate': features['zero_crossing_rate'],
                'energy_mean': features['energy_mean'],
                'energy_std': features['energy_std'],
                'recording_duration': features['recording_duration'],
                'sample_rate': features['sample_rate'],
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'confidence_score': 0.9
            }
            
            if self.supabase:
                # Supabase에 저장
                result = self.supabase.table('voice_profiles').upsert(profile_data).execute()
                if result.data:
                    print(f"✅ 행원 {employee_name}({employee_id}) 음성 프로필 Supabase 저장 완료")
                    return True
                else:
                    print(f"❌ Supabase 저장 실패")
                    return False
            else:
                # 로컬 파일로 저장 (백업)
                local_file = f"voice_profile_{employee_id}.json"
                with open(local_file, 'w', encoding='utf-8') as f:
                    json.dump(profile_data, f, ensure_ascii=False, indent=2)
                print(f"✅ 행원 {employee_name}({employee_id}) 음성 프로필 로컬 저장 완료: {local_file}")
                return True
            
        except Exception as e:
            print(f"❌ 음성 프로필 저장 실패: {e}")
            return False
    
    def get_voice_profile(self, employee_id: str) -> Optional[VoiceProfile]:
        """행원 음성 프로필 조회"""
        try:
            if self.supabase:
                result = self.supabase.table('voice_profiles').select('*').eq('employee_id', employee_id).execute()
                if result.data:
                    row = result.data[0]
                    return VoiceProfile(
                        employee_id=row['employee_id'],
                        employee_name=row['employee_name'],
                        voice_embedding=json.loads(row['voice_embedding']),
                        pitch_mean=row['pitch_mean'],
                        pitch_std=row['pitch_std'],
                        spectral_centroid_mean=row['spectral_centroid_mean'],
                        spectral_centroid_std=row['spectral_centroid_std'],
                        mfcc_features=json.loads(row['mfcc_features']),
                        zero_crossing_rate=row['zero_crossing_rate'],
                        energy_mean=row['energy_mean'],
                        energy_std=row['energy_std'],
                        recording_duration=row['recording_duration'],
                        sample_rate=row['sample_rate'],
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        confidence_score=row['confidence_score']
                    )
            else:
                # 로컬 파일에서 조회
                local_file = f"voice_profile_{employee_id}.json"
                if os.path.exists(local_file):
                    with open(local_file, 'r', encoding='utf-8') as f:
                        row = json.load(f)
                    return VoiceProfile(
                        employee_id=row['employee_id'],
                        employee_name=row['employee_name'],
                        voice_embedding=json.loads(row['voice_embedding']),
                        pitch_mean=row['pitch_mean'],
                        pitch_std=row['pitch_std'],
                        spectral_centroid_mean=row['spectral_centroid_mean'],
                        spectral_centroid_std=row['spectral_centroid_std'],
                        mfcc_features=json.loads(row['mfcc_features']),
                        zero_crossing_rate=row['zero_crossing_rate'],
                        energy_mean=row['energy_mean'],
                        energy_std=row['energy_std'],
                        recording_duration=row['recording_duration'],
                        sample_rate=row['sample_rate'],
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        confidence_score=row['confidence_score']
                    )
            return None
            
        except Exception as e:
            print(f"❌ 음성 프로필 조회 실패: {e}")
            return None
    
    def get_all_voice_profiles(self) -> List[VoiceProfile]:
        """모든 음성 프로필 조회"""
        try:
            profiles = []
            
            if self.supabase:
                result = self.supabase.table('voice_profiles').select('*').execute()
                for row in result.data:
                    profile = VoiceProfile(
                        employee_id=row['employee_id'],
                        employee_name=row['employee_name'],
                        voice_embedding=json.loads(row['voice_embedding']),
                        pitch_mean=row['pitch_mean'],
                        pitch_std=row['pitch_std'],
                        spectral_centroid_mean=row['spectral_centroid_mean'],
                        spectral_centroid_std=row['spectral_centroid_std'],
                        mfcc_features=json.loads(row['mfcc_features']),
                        zero_crossing_rate=row['zero_crossing_rate'],
                        energy_mean=row['energy_mean'],
                        energy_std=row['energy_std'],
                        recording_duration=row['recording_duration'],
                        sample_rate=row['sample_rate'],
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        confidence_score=row['confidence_score']
                    )
                    profiles.append(profile)
            else:
                # 로컬 파일들에서 조회
                for file in os.listdir('.'):
                    if file.startswith('voice_profile_') and file.endswith('.json'):
                        with open(file, 'r', encoding='utf-8') as f:
                            row = json.load(f)
                        profile = VoiceProfile(
                            employee_id=row['employee_id'],
                            employee_name=row['employee_name'],
                            voice_embedding=json.loads(row['voice_embedding']),
                            pitch_mean=row['pitch_mean'],
                            pitch_std=row['pitch_std'],
                            spectral_centroid_mean=row['spectral_centroid_mean'],
                            spectral_centroid_std=row['spectral_centroid_std'],
                            mfcc_features=json.loads(row['mfcc_features']),
                            zero_crossing_rate=row['zero_crossing_rate'],
                            energy_mean=row['energy_mean'],
                            energy_std=row['energy_std'],
                            recording_duration=row['recording_duration'],
                            sample_rate=row['sample_rate'],
                            created_at=row['created_at'],
                            updated_at=row['updated_at'],
                            confidence_score=row['confidence_score']
                        )
                        profiles.append(profile)
            
            return profiles
            
        except Exception as e:
            print(f"❌ 음성 프로필 목록 조회 실패: {e}")
            return []
    
    def compare_voice_similarity(self, audio_features: Dict, employee_id: str) -> float:
        """음성 유사도 비교"""
        try:
            profile = self.get_voice_profile(employee_id)
            if not profile:
                return 0.0
            
            # 유클리드 거리 계산
            current_embedding = audio_features.get('voice_embedding', [])
            stored_embedding = profile.voice_embedding
            
            if len(current_embedding) != len(stored_embedding):
                return 0.0
            
            # 거리 계산
            distance = np.linalg.norm(np.array(current_embedding) - np.array(stored_embedding))
            
            # 유사도 점수 (0-1, 1이 가장 유사)
            similarity = 1.0 / (1.0 + distance)
            
            return similarity
            
        except Exception as e:
            print(f"❌ 음성 유사도 비교 실패: {e}")
            return 0.0
    
    def identify_speaker(self, audio_features: Dict) -> Tuple[str, float]:
        """화자 식별 (가장 유사한 행원 찾기)"""
        try:
            profiles = self.get_all_voice_profiles()
            if not profiles:
                return "UNKNOWN", 0.0
            
            best_match = None
            best_similarity = 0.0
            
            for profile in profiles:
                similarity = self.compare_voice_similarity(audio_features, profile.employee_id)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = profile
            
            if best_match and best_similarity > 0.7:  # 임계값 0.7
                return best_match.employee_id, best_similarity
            else:
                return "CUSTOMER", best_similarity
                
        except Exception as e:
            print(f"❌ 화자 식별 실패: {e}")
            return "UNKNOWN", 0.0

# 사용 예시
if __name__ == "__main__":
    manager = SupabaseVoiceProfileManager()
    
    # 행원 음성 프로필 저장 예시
    # manager.save_voice_profile("E001", "김행원", "employee_voice_sample.wav")
    
    # 화자 식별 예시
    # audio_features = manager.extract_voice_features("test_audio.wav")
    # speaker_id, similarity = manager.identify_speaker(audio_features)
    # print(f"화자: {speaker_id}, 유사도: {similarity:.2f}")

