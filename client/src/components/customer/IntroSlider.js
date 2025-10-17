import React, { useState, useEffect } from "react";
import styled from "styled-components";
import advertisement_1이미지 from "../../assets/advertisement_1.jpg";
import advertisement_2이미지 from "../../assets/advertisement_2.png";

const IntroContainer = styled.div`
  width: 100vw;
  height: 50vw;
  position: relative;
  overflow: hidden;
  background: #000;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
`;

const SliderContainer = styled.div`
  display: flex;
  width: 600vw; /* 6 slides * 100vw */
  height: 100%;
  transition: transform 0.5s ease-in-out;
  transform: translateX(${(props) => -props.currentSlide * 100}vw);
`;

const Slide = styled.div`
  width: 100vw; /* 각 슬라이드가 전체 화면 너비 */
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const SlideImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TouchArea = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: pointer;
  background: transparent;
`;

const IntroSlider = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  // showConsent 제거됨 - PrivacyConsentModal에서 처리

  const originalSlides = [
    {
      id: 1,
      backgroundImage: advertisement_1이미지,
      title: "advertisement_1",
      subtitle: "하나은행 대표 모델",
      description: "신뢰와 안정의 하나은행을 만나보세요",
    },
    {
      id: 2,
      backgroundImage: advertisement_2이미지,
      title: "advertisement_2",
      subtitle: "하나은행 홍보대사",
      description: "고객과 함께하는 따뜻한 금융서비스",
    },
  ];

  // 무한 루프를 위해 슬라이드를 복제 (고유한 key를 위해 인덱스 추가)
  const slides = [
    ...originalSlides.map((slide, index) => ({
      ...slide,
      uniqueId: `first-${slide.id}`,
    })),
    ...originalSlides.map((slide, index) => ({
      ...slide,
      uniqueId: `second-${slide.id}`,
    })),
    ...originalSlides.map((slide, index) => ({
      ...slide,
      uniqueId: `third-${slide.id}`,
    })),
  ];

  useEffect(() => {
    let interval;

    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prevSlide) => {
          const nextSlide = prevSlide + 1;

          // 4번째 슬라이드(인덱스 3)에서 2번째 슬라이드(인덱스 2)로 점프
          if (nextSlide === 4) {
            // 잠시 대기 후 2번째 슬라이드로 점프
            setTimeout(() => {
              setCurrentSlide(2);
            }, 50);
            return 4; // 4번째 슬라이드 표시
          }

          return nextSlide;
        });
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, slides.length]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEndX(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // 오른쪽으로 스와이프 (다음 슬라이드)
        nextSlide();
      }
      // 왼쪽 스와이프는 비활성화 - 오른쪽으로만 진행
    }
  };

  const handleScreenTap = () => {
    console.log("🎯 [인트로] 화면 터치 감지 - 인트로 완료");
    setIsAutoPlaying(false);
    // 바로 인트로 완료 처리
    if (onComplete && typeof onComplete === "function") {
      console.log("🚀 [인트로] onComplete 호출 시작");
      onComplete();
      console.log("✅ [인트로] onComplete 호출 완료");
    }
  };

  // handleConsentAgree, handleConsentDecline 제거됨 - PrivacyConsentModal에서 처리

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  return (
    <IntroContainer>
      <SliderContainer currentSlide={currentSlide}>
        {slides.map((slide) => (
          <Slide key={slide.uniqueId}>
            <SlideImage src={slide.backgroundImage} alt={slide.title} />
          </Slide>
        ))}
      </SliderContainer>

      <TouchArea
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          console.log("🎯 [인트로] TouchArea 클릭 이벤트 발생");
          handleScreenTap();
        }}
      />

      {/* 개인정보 동의서 모달 제거됨 - PrivacyConsentModal에서 처리 */}
    </IntroContainer>
  );
};

export default IntroSlider;
