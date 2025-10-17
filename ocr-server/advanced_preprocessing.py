#!/usr/bin/env python3
"""
고급 이미지 전처리 전략
- 엣지케이스별 처리 기법 구현
- 빛 반사, 기울어짐, 흐릿함 처리
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance

class AdvancedPreprocessor:
    """고급 이미지 전처리 클래스"""
    
    def __init__(self):
        self.min_contour_area = 10000  # 최소 컨투어 면적
        self.skew_threshold = 1.0      # 기울기 임계값 (도)
        
    def detect_and_correct_skew(self, image):
        """기울어짐 감지 및 자동 수정 (Affine transformation)"""
        try:
            # 그레이스케일 변환
            gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY) if len(np.array(image).shape) == 3 else np.array(image)
            
            # 엣지 감지
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            
            # Hough 변환으로 직선 감지
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            
            if lines is not None:
                angles = []
                for line in lines:
                    rho, theta = line[0]
                    angle = theta * 180 / np.pi
                    # 수평선에 가까운 각도만 고려
                    if abs(angle - 90) < 45 or abs(angle) < 45:
                        angles.append(angle)
                
                if angles:
                    # 평균 각도 계산
                    median_angle = np.median(angles)
                    # 기울기가 임계값 이상일 때만 보정
                    if abs(median_angle) > self.skew_threshold:
                        # 이미지 회전
                        h, w = gray.shape
                        center = (w // 2, h // 2)
                        rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        corrected = cv2.warpAffine(gray, rotation_matrix, (w, h), 
                                                 flags=cv2.INTER_CUBIC, 
                                                 borderMode=cv2.BORDER_REPLICATE)
                        return Image.fromarray(corrected)
            
            return image
        except Exception:
            return image
    
    def handle_light_reflection(self, image):
        """빛 반사 처리 - Adaptive thresholding 및 자동 대비 조정"""
        try:
            # PIL 이미지를 OpenCV 형식으로 변환
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR) if len(np.array(image).shape) == 3 else np.array(image)
            
            # 그레이스케일 변환
            if len(cv_image.shape) == 3:
                gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = cv_image
            
            # CLAHE (Contrast Limited Adaptive Histogram Equalization) 적용
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # Adaptive thresholding 적용
            adaptive_thresh = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # 노이즈 제거
            kernel = np.ones((2,2), np.uint8)
            cleaned = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_CLOSE, kernel)
            
            return Image.fromarray(cleaned)
        except Exception:
            return image
    
    def handle_blurriness(self, image):
        """흐릿함 처리 - Sharpening filter 및 Multi-scale analysis"""
        try:
            # PIL 이미지를 numpy 배열로 변환
            img_array = np.array(image)
            
            # 그레이스케일 변환
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Multi-scale analysis를 위한 가우시안 피라미드
            scales = [1.0, 0.8, 1.2]
            enhanced_images = []
            
            for scale in scales:
                # 이미지 크기 조정
                h, w = gray.shape
                new_h, new_w = int(h * scale), int(w * scale)
                scaled = cv2.resize(gray, (new_w, new_h))
                
                # Unsharp masking 적용 (선명도 향상)
                gaussian = cv2.GaussianBlur(scaled, (0, 0), 2.0)
                unsharp_mask = cv2.addWeighted(scaled, 1.5, gaussian, -0.5, 0)
                
                # 원래 크기로 복원
                resized = cv2.resize(unsharp_mask, (w, h))
                enhanced_images.append(resized)
            
            # 여러 스케일의 결과를 평균
            final_image = np.mean(enhanced_images, axis=0).astype(np.uint8)
            
            # 추가 선명도 향상
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(final_image, -1, kernel)
            
            # 값 범위 정규화
            sharpened = np.clip(sharpened, 0, 255)
            
            return Image.fromarray(sharpened)
        except Exception:
            return image
    
    def detect_id_card_contour(self, image):
        """신분증 영역 자동 감지 (Contour detection)"""
        try:
            # PIL 이미지를 OpenCV 형식으로 변환
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR) if len(np.array(image).shape) == 3 else np.array(image)
            
            # 그레이스케일 변환
            if len(cv_image.shape) == 3:
                gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = cv_image
            
            # 가우시안 블러 적용
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Canny 엣지 감지
            edges = cv2.Canny(blurred, 50, 150)
            
            # 컨투어 찾기
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # 가장 큰 사각형 컨투어 찾기
            largest_contour = None
            max_area = 0
            
            for contour in contours:
                # 컨투어 근사화
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # 사각형인지 확인 (4개 꼭짓점)
                if len(approx) == 4:
                    area = cv2.contourArea(contour)
                    if area > max_area:
                        max_area = area
                        largest_contour = approx
            
            # 신분증 영역이 감지되면 해당 영역만 추출
            if largest_contour is not None and max_area > self.min_contour_area:
                # 컨투어를 감싸는 사각형
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # 원본 이미지에서 해당 영역 추출
                cropped = image.crop((x, y, x + w, y + h))
                return cropped
            
            return image
        except Exception:
            return image
    
    def enhance_image_quality(self, image):
        """기본 이미지 품질 향상"""
        try:
            # 그레이스케일 변환
            if image.mode != 'L':
                image = image.convert('L')
            
            # 대비 향상
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)
            
            # 선명도 향상
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.5)
            
            # 밝기 조정
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(1.1)
            
            return image
        except Exception:
            return image
    
    def resize_image_if_needed(self, image, min_width=1200, min_height=800):
        """이미지 크기 확대 (작은 이미지의 경우)"""
        try:
            width, height = image.size
            if width < min_width or height < min_height:
                scale_factor = max(min_width/width, min_height/height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            return image
        except Exception:
            return image
    
    def process_image_pipeline(self, image_path):
        """고급 엣지케이스 처리를 포함한 이미지 전처리 파이프라인"""
        try:
            image = Image.open(image_path)
            
            # 1. 신분증 영역 자동 감지 및 크롭
            image = self.detect_id_card_contour(image)
            
            # 2. 기울어짐 감지 및 자동 수정
            image = self.detect_and_correct_skew(image)
            
            # 3. 이미지 크기 확대 (작은 이미지의 경우)
            image = self.resize_image_if_needed(image)
            
            # 4. 빛 반사 처리 (Adaptive thresholding)
            image = self.handle_light_reflection(image)
            
            # 5. 흐릿함 처리 (Multi-scale analysis)
            image = self.handle_blurriness(image)
            
            # 6. 기본 이미지 품질 향상
            image = self.enhance_image_quality(image)
            
            return image
        except Exception:
            return Image.open(image_path)

# 사용 예시
if __name__ == "__main__":
    preprocessor = AdvancedPreprocessor()
    
    # 테스트 이미지 처리
    test_image_path = "test_image.png"
    if os.path.exists(test_image_path):
        processed_image = preprocessor.process_image_pipeline(test_image_path)
        processed_image.save("processed_test_image.png")
        print("이미지 전처리 완료: processed_test_image.png")
    else:
        print("테스트 이미지가 없습니다.")
