#!/usr/bin/env python3
"""
OCR 테스트용 신분증 이미지 생성기
- 다양한 엣지케이스 테스트 이미지 생성
- 빛 반사, 기울어짐, 흐릿함 효과 적용
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import base64
import io

class IDCardGenerator:
    """신분증 이미지 생성 클래스"""
    
    def __init__(self):
        self.width = 800
        self.height = 500
        self.background_color = 'white'
        
    def _get_fonts(self):
        """폰트 설정"""
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
            normal_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
        except:
            title_font = ImageFont.load_default()
            normal_font = ImageFont.load_default()
        return title_font, normal_font
    
    def _draw_id_card_content(self, image, title_font, normal_font):
        """신분증 기본 내용 그리기"""
        draw = ImageDraw.Draw(image)
        
        # 신분증 내용
        content = [
            ("대한민국 주민등록증", 50, 30, title_font),
            ("성명: 홍길동", 50, 80, normal_font),
            ("주민등록번호: 951216-378557", 50, 110, normal_font),
            ("주소: 서울특별시 강남구 테헤란로 123", 50, 140, normal_font),
            ("발급일: 2020.01.15", 50, 170, normal_font),
            ("발급기관: 서울특별시 강남구청장", 50, 200, normal_font),
        ]
        
        for text, x, y, font in content:
            draw.text((x, y), text, fill='black', font=font)
    
    def _apply_reflection_effect(self, image):
        """빛 반사 효과 적용"""
        reflection = Image.new('RGBA', (self.width, self.height), (255, 255, 255, 0))
        reflection_draw = ImageDraw.Draw(reflection)
        reflection_draw.ellipse([200, 100, 600, 300], fill=(255, 255, 255, 100))
        return Image.alpha_composite(image.convert('RGBA'), reflection).convert('RGB')
    
    def _apply_skew_effect(self, image):
        """기울어짐 효과 적용"""
        return image.rotate(15, fillcolor='white', expand=True)
    
    def _apply_blur_effect(self, image):
        """흐릿함 효과 적용"""
        return image.filter(ImageFilter.GaussianBlur(radius=2))
    
    def generate_normal_id_card(self):
        """일반 신분증 생성"""
        image = Image.new('RGB', (self.width, self.height), color=self.background_color)
        title_font, normal_font = self._get_fonts()
        self._draw_id_card_content(image, title_font, normal_font)
        return image
    
    def generate_reflection_id_card(self):
        """빛 반사 효과가 있는 신분증 생성"""
        image = self.generate_normal_id_card()
        return self._apply_reflection_effect(image)
    
    def generate_skew_id_card(self):
        """기울어짐 효과가 있는 신분증 생성"""
        image = self.generate_normal_id_card()
        return self._apply_skew_effect(image)
    
    def generate_blur_id_card(self):
        """흐릿함 효과가 있는 신분증 생성"""
        image = self.generate_normal_id_card()
        return self._apply_blur_effect(image)
    
    def generate_custom_id_card(self, case_type='normal'):
        """커스텀 신분증 생성"""
        generators = {
            'normal': self.generate_normal_id_card,
            'reflection': self.generate_reflection_id_card,
            'skew': self.generate_skew_id_card,
            'blur': self.generate_blur_id_card,
        }
        
        generator = generators.get(case_type, self.generate_normal_id_card)
        return generator()
    
    def image_to_base64(self, image):
        """이미지를 Base64로 변환"""
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        return base64.b64encode(img_byte_arr).decode()
    
    def generate_test_image(self, case_type='normal'):
        """테스트 이미지 생성 및 Base64 반환"""
        image = self.generate_custom_id_card(case_type)
        return self.image_to_base64(image)

# 사용 예시
if __name__ == "__main__":
    generator = IDCardGenerator()
    
    # 다양한 케이스 테스트
    cases = ['normal', 'reflection', 'skew', 'blur']
    
    for case in cases:
        print(f"Generating {case} case...")
        image = generator.generate_custom_id_card(case)
        image.save(f"test_id_card_{case}.png")
        print(f"Saved: test_id_card_{case}.png")
