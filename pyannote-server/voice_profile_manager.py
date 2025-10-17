#!/usr/bin/env python3
"""
음성 프로필 관리 모듈
- Supabase에서 음성 프로필 로드
- 프로필 캐싱 및 관리
"""

import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class VoiceProfileManager:
    """음성 프로필 관리 클래스"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.voice_profiles = {}
        
    def load_voice_profiles(self) -> Dict[str, Any]:
        """Supabase에서 음성 프로필 로드"""
        try:
            headers = {
                'apikey': self.supabase_key,
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': 'application/json'
            }
            
            # voice_profiles 테이블에서 데이터 조회
            response = requests.get(
                f"{self.supabase_url}/rest/v1/voice_profiles",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            profiles_data = response.json()
            logger.info(f"📊 Supabase에서 {len(profiles_data)}개의 음성 프로필 로드")
            
            # 프로필 데이터 정리
            self.voice_profiles = {}
            for profile in profiles_data:
                employee_id = profile.get('employee_id')
                if not employee_id:
                    continue
                
                # audio_features가 JSON 문자열인 경우 파싱
                audio_features = profile.get('audio_features')
                if isinstance(audio_features, str):
                    try:
                        audio_features = json.loads(audio_features)
                    except json.JSONDecodeError:
                        audio_features = None
                
                self.voice_profiles[employee_id] = {
                    'employee_id': employee_id,
                    'employee_name': profile.get('employee_name', 'Unknown'),
                    'audio_url': profile.get('audio_file_url'),
                    'confidence_score': profile.get('confidence_score', 0.9),
                    'features': audio_features,
                    'feature_dimension': profile.get('feature_dimension', 13)
                }
                
                logger.info(f"✅ {employee_id} ({profile.get('employee_name', 'Unknown')}) 프로필 로드 완료")
            
            logger.info(f"🎯 총 {len(self.voice_profiles)}개의 음성 프로필 로드 완료")
            return self.voice_profiles
            
        except Exception as e:
            logger.error(f"❌ 음성 프로필 로드 실패: {str(e)}")
            return {}
    
    def get_voice_profiles(self) -> Dict[str, Any]:
        """현재 로드된 음성 프로필 반환"""
        return self.voice_profiles
    
    def reload_voice_profiles(self) -> Dict[str, Any]:
        """음성 프로필 재로드"""
        logger.info("🔄 음성 프로필 재로드 시작...")
        return self.load_voice_profiles()
    
    def get_profile_by_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """특정 직원 ID의 프로필 반환"""
        return self.voice_profiles.get(employee_id)
    
    def get_profile_count(self) -> int:
        """로드된 프로필 개수 반환"""
        return len(self.voice_profiles)
    
    def is_profile_loaded(self, employee_id: str) -> bool:
        """특정 프로필이 로드되었는지 확인"""
        return employee_id in self.voice_profiles

# 사용 예시
if __name__ == "__main__":
    # 테스트용 설정
    SUPABASE_URL = "https://jhfjigeuxrxxbbsoflcd.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ"
    
    manager = VoiceProfileManager(SUPABASE_URL, SUPABASE_KEY)
    profiles = manager.load_voice_profiles()
    
    print(f"로드된 프로필 수: {manager.get_profile_count()}")
    for employee_id, profile in profiles.items():
        print(f"- {employee_id}: {profile['employee_name']}")
