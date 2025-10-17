import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const SuccessIcon = styled.div`
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease-in-out;
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-20px);
    }
    60% {
      transform: translateY(-10px);
    }
  }
`;

const Title = styled.h2`
  color: #28a745;
  margin: 0 0 20px 0;
  font-size: 28px;
  font-weight: bold;
`;

const Message = styled.p`
  color: #333;
  font-size: 18px;
  line-height: 1.6;
  margin: 0 0 30px 0;
`;

const DetailsContainer = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-weight: bold;
  color: #495057;
`;

const DetailValue = styled.span`
  color: #007bff;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EnrollmentSuccessModal = ({ 
  isOpen, 
  onClose, 
  enrollmentData = {} 
}) => {
  if (!isOpen) return null;

  const {
    customerName = "고객님",
    productName = "하나금융상품",
    submissionId = `SUB_${Date.now()}`,
    completionDate = new Date().toLocaleDateString('ko-KR'),
    completionTime = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } = enrollmentData;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <SuccessIcon>🎉</SuccessIcon>
        
        <Title>가입 완료!</Title>
        
        <Message>
          <strong>{customerName}</strong>님,<br />
          성공적으로 가입을 마쳤습니다!
        </Message>
        
        <DetailsContainer>
          <DetailRow>
            <DetailLabel>상품명:</DetailLabel>
            <DetailValue>{productName}</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>가입일시:</DetailLabel>
            <DetailValue>{completionDate} {completionTime}</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>신청번호:</DetailLabel>
            <DetailValue>{submissionId}</DetailValue>
          </DetailRow>
          
          <DetailRow>
            <DetailLabel>상태:</DetailLabel>
            <DetailValue style={{ color: '#28a745' }}>✅ 가입 완료</DetailValue>
          </DetailRow>
        </DetailsContainer>
        
        <CloseButton onClick={onClose}>
          확인
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EnrollmentSuccessModal;
