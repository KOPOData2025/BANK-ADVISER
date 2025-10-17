"""
음성 특징 캐싱 시스템
성능 최적화: MFCC 특징 추출 결과 캐싱, 비동기 처리, 배치 처리
"""

import redis
import pickle
import hashlib
import asyncio
import concurrent.futures
import multiprocessing
import numpy as np
import librosa
import logging
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timedelta
import os
import tempfile
import subprocess
import base64
from scipy.io import wavfile as scipy_wavfile

logger = logging.getLogger(__name__)

class VoiceFeatureCache:
    """음성 특징 캐싱 클래스"""
    
    def __init__(self, redis_host='localhost', redis_port=6379, redis_db=0):
        self.redis_client = None
        self.memory_cache = {}  # 메모리 캐시 (Redis 대신 사용)
        self.cache_timestamps = {}
        self.cache_ttl = 3600  # 1시간
        
        # Redis 연결 시도
        try:
            self.redis_client = redis.Redis(
                host=redis_host, 
                port=redis_port, 
                db=redis_db, 
                decode_responses=False
            )
            self.redis_client.ping()
            logger.info("✅ Redis 연결 성공")
        except Exception as e:
            logger.warning(f"⚠️ Redis 연결 실패, 메모리 캐시 사용: {e}")
            self.redis_client = None
    
    def _generate_audio_hash(self, audio_data: bytes) -> str:
        """오디오 데이터의 해시 생성"""
        return hashlib.md5(audio_data).hexdigest()
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """캐시 유효성 검사"""
        if self.redis_client:
            return self.redis_client.exists(cache_key)
        else:
            timestamp = self.cache_timestamps.get(cache_key)
            if timestamp is None:
                return False
            return (datetime.now() - timestamp).seconds < self.cache_ttl
    
    def get_cached_features(self, audio_hash: str) -> Optional[np.ndarray]:
        """캐시된 음성 특징 조회"""
        cache_key = f"voice_features:{audio_hash}"
        
        if self.redis_client:
            try:
                cached_data = self.redis_client.get(cache_key)
                if cached_data:
                    logger.info(f"✅ Redis 캐시 히트: {audio_hash}")
                    return pickle.loads(cached_data)
            except Exception as e:
                logger.error(f"❌ Redis 캐시 조회 실패: {e}")
        
        # 메모리 캐시 확인
        if cache_key in self.memory_cache and self._is_cache_valid(cache_key):
            logger.info(f"✅ 메모리 캐시 히트: {audio_hash}")
            return self.memory_cache[cache_key]
        
        return None
    
    def cache_features(self, audio_hash: str, features: np.ndarray) -> None:
        """음성 특징 캐싱"""
        cache_key = f"voice_features:{audio_hash}"
        
        if self.redis_client:
            try:
                self.redis_client.setex(
                    cache_key, 
                    self.cache_ttl, 
                    pickle.dumps(features)
                )
                logger.info(f"✅ Redis 캐시 저장: {audio_hash}")
            except Exception as e:
                logger.error(f"❌ Redis 캐시 저장 실패: {e}")
        
        # 메모리 캐시에도 저장
        self.memory_cache[cache_key] = features
        self.cache_timestamps[cache_key] = datetime.now()
        logger.info(f"✅ 메모리 캐시 저장: {audio_hash}")
    
    def extract_audio_features_cached(self, audio_data: bytes) -> Optional[np.ndarray]:
        """캐싱된 음성 특징 추출"""
        audio_hash = self._generate_audio_hash(audio_data)
        
        # 캐시 확인
        cached_features = self.get_cached_features(audio_hash)
        if cached_features is not None:
            return cached_features
        
        # 특징 추출
        logger.info(f"🔧 음성 특징 추출 시작: {audio_hash}")
        features = self._extract_mfcc_features(audio_data)
        
        if features is not None:
            # 캐시에 저장
            self.cache_features(audio_hash, features)
            logger.info(f"✅ 음성 특징 추출 완료: {audio_hash}")
        
        return features
    
    def _extract_mfcc_features(self, audio_data: bytes) -> Optional[np.ndarray]:
        """MFCC 특징 추출"""
        temp_file = None
        try:
            # 임시 파일로 저장
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                f.write(audio_data)
                temp_file = f.name
            
            # 오디오 로드
            y, sr = librosa.load(temp_file, sr=16000)
            
            # MFCC 추출
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfccs_mean = np.mean(mfccs, axis=1)
            
            return mfccs_mean
            
        except Exception as e:
            logger.error(f"❌ MFCC 특징 추출 실패: {e}")
            return None
        finally:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)

class AsyncVoiceProcessor:
    """비동기 음성 처리 클래스"""
    
    def __init__(self, max_workers=4):
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
        self.voice_cache = VoiceFeatureCache()
    
    async def process_audio_async(self, audio_data: bytes) -> Optional[np.ndarray]:
        """비동기 오디오 처리"""
        loop = asyncio.get_event_loop()
        
        try:
            features = await loop.run_in_executor(
                self.executor, 
                self.voice_cache.extract_audio_features_cached, 
                audio_data
            )
            return features
        except Exception as e:
            logger.error(f"❌ 비동기 오디오 처리 실패: {e}")
            return None
    
    async def batch_process_audio(self, audio_list: List[bytes]) -> List[Optional[np.ndarray]]:
        """배치 오디오 처리"""
        tasks = [self.process_audio_async(audio_data) for audio_data in audio_list]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"❌ 배치 처리 중 오류: {result}")
                processed_results.append(None)
            else:
                processed_results.append(result)
        
        return processed_results
    
    def close(self):
        """리소스 정리"""
        self.executor.shutdown(wait=True)

class VoiceSimilarityCalculator:
    """음성 유사도 계산기 (최적화)"""
    
    def __init__(self):
        self.similarity_cache = {}
        self.cache_ttl = 1800  # 30분
    
    def calculate_similarity_cached(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """캐싱된 유사도 계산"""
        if features1 is None or features2 is None:
            return 0.0
        
        # 캐시 키 생성
        cache_key = self._generate_similarity_key(features1, features2)
        
        # 캐시 확인
        if cache_key in self.similarity_cache:
            timestamp, similarity = self.similarity_cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_ttl:
                logger.info(f"✅ 유사도 캐시 히트: {cache_key}")
                return similarity
        
        # 유사도 계산
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            similarity = cosine_similarity([features1], [features2])[0][0]
            
            # 캐시에 저장
            self.similarity_cache[cache_key] = (datetime.now(), similarity)
            logger.info(f"✅ 유사도 계산 완료: {similarity:.4f}")
            
            return similarity
        except Exception as e:
            logger.error(f"❌ 유사도 계산 실패: {e}")
            return 0.0
    
    def _generate_similarity_key(self, features1: np.ndarray, features2: np.ndarray) -> str:
        """유사도 계산용 캐시 키 생성"""
        hash1 = hashlib.md5(features1.tobytes()).hexdigest()[:8]
        hash2 = hashlib.md5(features2.tobytes()).hexdigest()[:8]
        return f"similarity:{hash1}:{hash2}"
    
    def cleanup_expired_cache(self):
        """만료된 캐시 정리"""
        current_time = datetime.now()
        expired_keys = [
            key for key, (timestamp, _) in self.similarity_cache.items()
            if (current_time - timestamp).seconds >= self.cache_ttl
        ]
        
        for key in expired_keys:
            del self.similarity_cache[key]
        
        if expired_keys:
            logger.info(f"🧹 만료된 유사도 캐시 정리: {len(expired_keys)}개 항목 제거")

class VoicePerformanceOptimizer:
    """음성 처리 성능 최적화 메인 클래스"""
    
    def __init__(self):
        self.async_processor = AsyncVoiceProcessor()
        self.similarity_calculator = VoiceSimilarityCalculator()
        self.performance_stats = {
            'cache_hits': 0,
            'cache_misses': 0,
            'total_requests': 0,
            'average_processing_time': 0.0
        }
    
    async def process_voice_with_optimization(self, audio_data: bytes) -> Dict:
        """최적화된 음성 처리"""
        start_time = datetime.now()
        self.performance_stats['total_requests'] += 1
        
        try:
            # 비동기 특징 추출
            features = await self.async_processor.process_audio_async(audio_data)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            self._update_performance_stats(processing_time)
            
            return {
                'success': True,
                'features': features,
                'processing_time': processing_time,
                'audio_hash': hashlib.md5(audio_data).hexdigest()
            }
            
        except Exception as e:
            logger.error(f"❌ 최적화된 음성 처리 실패: {e}")
            return {
                'success': False,
                'error': str(e),
                'processing_time': (datetime.now() - start_time).total_seconds()
            }
    
    def calculate_voice_similarity_optimized(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """최적화된 음성 유사도 계산"""
        return self.similarity_calculator.calculate_similarity_cached(features1, features2)
    
    def _update_performance_stats(self, processing_time: float):
        """성능 통계 업데이트"""
        current_avg = self.performance_stats['average_processing_time']
        total_requests = self.performance_stats['total_requests']
        
        # 이동 평균 계산
        self.performance_stats['average_processing_time'] = (
            (current_avg * (total_requests - 1) + processing_time) / total_requests
        )
    
    def get_performance_stats(self) -> Dict:
        """성능 통계 조회"""
        cache_hit_rate = 0.0
        if self.performance_stats['total_requests'] > 0:
            cache_hit_rate = (
                self.performance_stats['cache_hits'] / 
                self.performance_stats['total_requests']
            )
        
        return {
            **self.performance_stats,
            'cache_hit_rate': cache_hit_rate,
            'memory_cache_size': len(self.async_processor.voice_cache.memory_cache),
            'similarity_cache_size': len(self.similarity_calculator.similarity_cache)
        }
    
    def cleanup_all_caches(self):
        """모든 캐시 정리"""
        self.similarity_calculator.cleanup_expired_cache()
        logger.info("🧹 모든 음성 처리 캐시 정리 완료")
    
    def close(self):
        """리소스 정리"""
        self.async_processor.close()

# 전역 인스턴스
voice_optimizer = VoicePerformanceOptimizer()

def get_voice_optimizer() -> VoicePerformanceOptimizer:
    """음성 최적화기 인스턴스 반환"""
    return voice_optimizer

