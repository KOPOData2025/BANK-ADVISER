#!/usr/bin/env python3
"""
텍스트 기반 화자 분류 모듈
- 텍스트 내용을 기반으로 화자 분류
- 키워드 및 패턴 매칭
"""

import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class TextClassifier:
    """텍스트 기반 화자 분류 클래스"""
    
    def __init__(self):
        # 행원이 사용할 가능성이 높은 키워드들
        self.employee_keywords = [
            '상품', '금리', '예금', '적금', '대출', '보험', '펀드', '투자',
            '계좌', '카드', '신용', '대출', '이자', '수수료', '혜택',
            '가입', '해지', '변경', '조회', '출금', '입금', '이체',
            '고객님', '어떻게', '도와드릴까요', '궁금한', '문의',
            '안내', '설명', '추천', '비교', '분석', '계산', '시뮬레이션'
        ]
        
        # 고객이 사용할 가능성이 높은 키워드들
        self.customer_keywords = [
            '궁금해요', '알고 싶어요', '어떻게 해야', '도와주세요',
            '추천해주세요', '비교해주세요', '계산해주세요', '설명해주세요',
            '가입하고 싶어요', '해지하고 싶어요', '변경하고 싶어요',
            '얼마나', '언제', '어디서', '왜', '어떤', '무엇'
        ]
        
        # 행원 전용 표현
        self.employee_patterns = [
            r'고객님.*(?:어떻게|무엇을|도와드릴까요)',
            r'(?:상품|금리|예금|적금).*(?:안내|설명|추천)',
            r'(?:계산|분석|비교).*해드릴까요',
            r'궁금한.*(?:점|사항).*있으시면'
        ]
        
        # 고객 전용 표현
        self.customer_patterns = [
            r'(?:궁금해요|알고 싶어요|도와주세요)',
            r'(?:추천|비교|계산|설명).*해주세요',
            r'(?:가입|해지|변경).*하고 싶어요',
            r'(?:얼마나|언제|어디서|왜|어떤|무엇)'
        ]
    
    def classify_speaker_by_text(self, transcript: str) -> Dict[str, Any]:
        """텍스트 내용을 기반으로 화자 분류"""
        try:
            if not transcript or not transcript.strip():
                return self._default_customer_result()
            
            # 텍스트 정규화
            normalized_text = transcript.strip().lower()
            
            # 패턴 매칭 점수 계산
            employee_score = self._calculate_pattern_score(normalized_text, self.employee_patterns)
            customer_score = self._calculate_pattern_score(normalized_text, self.customer_patterns)
            
            # 키워드 매칭 점수 계산
            employee_keyword_score = self._calculate_keyword_score(normalized_text, self.employee_keywords)
            customer_keyword_score = self._calculate_keyword_score(normalized_text, self.customer_keywords)
            
            # 전체 점수 계산 (패턴 70%, 키워드 30%)
            total_employee_score = (employee_score * 0.7) + (employee_keyword_score * 0.3)
            total_customer_score = (customer_score * 0.7) + (customer_keyword_score * 0.3)
            
            logger.info(f"🔍 텍스트 분류 점수 - 행원: {total_employee_score:.2f}, 고객: {total_customer_score:.2f}")
            
            # 분류 결정
            if total_employee_score > total_customer_score and total_employee_score > 0.3:
                return {
                    'speaker_id': 'speaker_employee',
                    'speaker_name': 'employee',
                    'confidence': min(total_employee_score, 0.9),
                    'similarity': 0.0,
                    'decision_reason': 'text_employee',
                    'overlap': False,
                    'employee_id': None,
                    'employee_name': None,
                    'secondary_speaker': None
                }
            else:
                return {
                    'speaker_id': 'speaker_customer',
                    'speaker_name': 'customer',
                    'confidence': min(total_customer_score + 0.1, 0.9),
                    'similarity': 0.0,
                    'decision_reason': 'text_customer',
                    'overlap': False,
                    'employee_id': None,
                    'employee_name': None,
                    'secondary_speaker': None
                }
                
        except Exception as e:
            logger.error(f"❌ 텍스트 분류 실패: {str(e)}")
            return self._default_customer_result()
    
    def _calculate_pattern_score(self, text: str, patterns: list) -> float:
        """패턴 매칭 점수 계산"""
        score = 0.0
        for pattern in patterns:
            if re.search(pattern, text):
                score += 0.2
        return min(score, 1.0)
    
    def _calculate_keyword_score(self, text: str, keywords: list) -> float:
        """키워드 매칭 점수 계산"""
        score = 0.0
        matched_keywords = 0
        
        for keyword in keywords:
            if keyword in text:
                matched_keywords += 1
                score += 0.1
        
        # 키워드 개수에 따른 보너스
        if matched_keywords >= 3:
            score += 0.2
        elif matched_keywords >= 2:
            score += 0.1
        
        return min(score, 1.0)
    
    def _default_customer_result(self) -> Dict[str, Any]:
        """기본 고객 결과 반환"""
        return {
            'speaker_id': 'speaker_customer',
            'speaker_name': 'customer',
            'confidence': 0.7,
            'similarity': 0.0,
            'decision_reason': 'text_default',
            'overlap': False,
            'employee_id': None,
            'employee_name': None,
            'secondary_speaker': None
        }

# 사용 예시
if __name__ == "__main__":
    classifier = TextClassifier()
    
    # 테스트 케이스들
    test_cases = [
        "고객님, 어떤 상품에 관심이 있으신가요?",
        "예금 상품을 추천해주세요",
        "금리가 얼마나 되나요?",
        "계산해주세요",
        "안녕하세요"
    ]
    
    for text in test_cases:
        result = classifier.classify_speaker_by_text(text)
        print(f"텍스트: '{text}'")
        print(f"결과: {result['speaker_name']} (신뢰도: {result['confidence']:.2f})")
        print()
