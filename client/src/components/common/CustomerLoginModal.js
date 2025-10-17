import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";

// 애니메이션 키프레임
const slideInFromBottom = keyframes`
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const cardScan = keyframes`
  0% {
    transform: scaleY(0);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
  100% {
    transform: scaleY(0);
    opacity: 0.7;
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 150, 136, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 150, 136, 0.6);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 스타일 컴포넌트들
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: ${slideInFromBottom} 0.4s ease-out;
  position: relative;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #00a693 0%, #00d4aa 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 24px 24px 0 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
      repeat;
    opacity: 0.5;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  position: relative;
  z-index: 1;
`;

const Subtitle = styled.p`
  margin: 8px 0 0 0;
  opacity: 0.9;
  font-size: 16px;
  position: relative;
  z-index: 1;
`;

const IDCardSection = styled.div`
  padding: 40px 30px;
  text-align: center;
`;

const IDCardContainer = styled.div`
  position: relative;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
  border: 2px dashed #00a693;
  border-radius: 16px;
  padding: 40px 20px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #00d4aa;
    background: linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%);
    animation: ${pulseGlow} 2s infinite;
  }

  ${(props) =>
    props.isUploading &&
    `
    border-color: #00d4aa;
    background: linear-gradient(145deg, #e8f5e8 0%, #f0f8ff 100%);
  `}
`;

const IDCardIcon = styled.div`
  width: 80px;
  height: 50px;
  background: linear-gradient(135deg, #00a693 0%, #00d4aa 100%);
  border-radius: 8px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: ${cardScan} 2s infinite;
  }

  svg {
    width: 32px;
    height: 32px;
    fill: white;
    position: relative;
    z-index: 1;
  }
`;

const UploadText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
`;

const UploadSubtext = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 30px;
`;

const UploadButton = styled.button`
  background: linear-gradient(135deg, #00a693 0%, #00d4aa 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 166, 147, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 166, 147, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CameraButton = styled(UploadButton)`
  background: linear-gradient(135deg, #2196f3 0%, #21cbf3 100%);
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);

  &:hover {
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
  }
`;

const CustomerName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const CustomerInfo = styled.div`
  font-size: 12px;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  border-left: 4px solid #c62828;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00a693;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 16px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  svg {
    width: 20px;
    height: 20px;
    fill: white;
  }
`;

const CustomerLoginModal = ({
  isOpen,
  onClose,
  onCustomerLogin,
  testCustomers = [],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // 개발 편의를 위한 자동 OCR 모드: ?autoOCR=1 이고 비프로덕션 환경일 때 동작
  useEffect(() => {
    if (!isOpen) return;
    const isDev = process.env.NODE_ENV !== "production";
    const params = new URLSearchParams(window.location.search);
    const auto = params.get("autoOCR");
    if (!isDev || auto !== "1") return;

    const fallbackCustomer = {
      CustomerID: "C6660",
      Name: "테스트 고객",
      Gender: "M",
      Age: 36,
      MonthlyIncome: 4200000,
      Address: "서울시 테스트구",
      RegistrationDate: "2024-01-10",
      LastEvaluatedDate: "2025-10-01",
    };
    const customer = testCustomers?.[0] || fallbackCustomer;

    // 약간의 지연 후 자동 로그인 처리
    const t = setTimeout(() => {
      try {
        onCustomerLogin && onCustomerLogin(customer);
      } finally {
        onClose && onClose();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen, onClose, onCustomerLogin, testCustomers]);

  if (!isOpen) return null;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("idCard", file);

      console.log("🔍 OCR 서버로 파일 전송 중...", file.name);

      const response = await fetch("/api/ocr/id-card", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR 서버 응답 오류: ${response.status}`);
      }

      const ocrResult = await response.json();
      console.log("🔍 OCR 결과:", ocrResult);

      if (ocrResult.success && ocrResult.customer) {
        console.log("✅ 고객 정보 인식 성공:", ocrResult.customer);
        onCustomerLogin(ocrResult.customer);
        onClose();
      } else {
        setUploadError(
          ocrResult.message ||
            "고객 정보를 인식할 수 없습니다. 다시 시도해주세요."
        );
      }
    } catch (error) {
      console.error("OCR 처리 오류:", error);
      setUploadError("OCR 처리에 실패했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <Header>
          <CloseButton onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </CloseButton>

          <Title>고객 신분증을 인식해주세요</Title>
          <Subtitle>
            신분증을 카메라로 촬영하거나 파일로 업로드하면
            <br />
            자동으로 고객 정보를 인식합니다
          </Subtitle>
        </Header>

        <IDCardSection>
          <IDCardContainer
            isUploading={isUploading}
            onClick={!isUploading ? handleFileSelect : undefined}
          >
            {isUploading ? (
              <>
                <LoadingSpinner />
                <UploadText style={{ color: "#00a693" }}>
                  신분증을 인식하고 있습니다...
                </UploadText>
                <UploadSubtext>잠시만 기다려주세요</UploadSubtext>
              </>
            ) : (
              <>
                <IDCardIcon>
                  <svg viewBox="0 0 24 24">
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                  </svg>
                </IDCardIcon>
                <UploadText>신분증을 업로드하세요</UploadText>
                <UploadSubtext>
                  클릭하여 파일을 선택하거나
                  <br />
                  아래 버튼으로 촬영해주세요
                </UploadSubtext>
              </>
            )}
          </IDCardContainer>

          <ButtonGroup>
            <UploadButton onClick={handleFileSelect} disabled={isUploading}>
              📁 파일 선택
            </UploadButton>
            <CameraButton onClick={handleCameraCapture} disabled={isUploading}>
              📷 카메라 촬영
            </CameraButton>
          </ButtonGroup>

          {uploadError && <ErrorMessage>{uploadError}</ErrorMessage>}
        </IDCardSection>

        {/* 숨겨진 input 요소들 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CustomerLoginModal;
