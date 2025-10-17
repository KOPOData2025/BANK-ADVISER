import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #2d3748;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
  margin: 0;
`;

const FieldInfo = styled.div`
  background: #f7fafc;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border-left: 4px solid #4caf50;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #4a5568;
`;

const InfoValue = styled.span`
  color: #2d3748;
`;

const InputContainer = styled.div`
  margin-bottom: 2rem;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #4a5568;
  font-size: 1.2rem;
`;

const Required = styled.span`
  color: #e53e3e;
  margin-left: 0.25rem;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 1.5rem;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.3rem;
  outline: none;
  transition: all 0.3s ease;
  text-align: center;

  &:focus {
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    transform: scale(1.02);
  }

  &::placeholder {
    color: #a0aec0;
    font-style: italic;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CancelButton = styled(Button)`
  background: #e2e8f0;
  color: #4a5568;

  &:hover {
    background: #cbd5e0;
  }
`;

const ConfirmButton = styled(Button)`
  background: #4caf50;
  color: white;

  &:hover {
    background: #45a049;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FieldInputModal = ({
  isOpen,
  fieldData,
  currentValue = "",
  onComplete,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(currentValue);

  useEffect(() => {
    setInputValue(currentValue);
  }, [currentValue, isOpen]);

  const handleConfirm = () => {
    if (fieldData?.required && !inputValue.trim()) {
      return; // 필수 필드가 비어있으면 완료하지 않음
    }
    onComplete(inputValue);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isOpen || !fieldData) return null;

  return (
    <ModalOverlay onClick={handleCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>📝 필드 입력</Title>
          <Subtitle>{fieldData.fieldLabel}을(를) 입력해주세요</Subtitle>
        </Header>

        <FieldInfo>
          <InfoRow>
            <InfoLabel>서식:</InfoLabel>
            <InfoValue>{fieldData.formName || "알 수 없음"}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>필드 ID:</InfoLabel>
            <InfoValue>{fieldData.fieldId}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>타입:</InfoLabel>
            <InfoValue>{fieldData.fieldType || "text"}</InfoValue>
          </InfoRow>
        </FieldInfo>

        <InputContainer>
          <InputLabel>
            {fieldData.fieldLabel}
            {fieldData.required && <Required>*</Required>}
          </InputLabel>
          <StyledInput
            type={fieldData.fieldType === "number" ? "number" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              fieldData.fieldPlaceholder ||
              `${fieldData.fieldLabel}을(를) 입력해주세요`
            }
            autoFocus
          />
        </InputContainer>

        <ButtonContainer>
          <CancelButton onClick={handleCancel}>취소</CancelButton>
          <ConfirmButton
            onClick={handleConfirm}
            disabled={fieldData.required && !inputValue.trim()}
          >
            확인
          </ConfirmButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FieldInputModal;
