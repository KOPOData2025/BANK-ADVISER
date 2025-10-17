import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const RecommendationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #00a651 0%, #007a3d 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
`;

const RecommendationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  max-width: 1200px;
  width: 100%;
  margin-bottom: 30px;
`;

const ProductCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00a651, #007a3d);
  }
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const ProductName = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  flex: 1;
  line-height: 1.3;
`;

const ScoreBadge = styled.div`
  background: linear-gradient(135deg, #00a651, #007a3d);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 15px;
`;

const ProductType = styled.div`
  background: #f7fafc;
  color: #4a5568;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 15px;
`;

const ProductDetails = styled.div`
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.95rem;
`;

const DetailLabel = styled.span`
  color: #718096;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #2d3748;
  font-weight: 600;
`;

const InterestRate = styled.div`
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  padding: 12px 20px;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 20px;
`;

const RateValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const RateLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const RecommendationReason = styled.div`
  background: #f7fafc;
  padding: 20px;
  border-radius: 15px;
  border-left: 4px solid #00a651;
  margin-bottom: 20px;
`;

const ReasonTitle = styled.h4`
  color: #2d3748;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 10px 0;
`;

const ReasonText = styled.p`
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
`;

// 고객 상호작용 제거 - ActionButtons와 Button 스타일 제거

const ConfidenceIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  color: white;
`;

const ConfidenceBar = styled.div`
  width: 200px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 15px;
`;

const ConfidenceFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00a651, #007a3d);
  border-radius: 4px;
  transition: width 0.5s ease;
  width: ${(props) => props.confidence * 100}%;
`;

const ConfidenceText = styled.span`
  font-size: 1rem;
  font-weight: 600;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 20px;
  text-align: center;
`;

// 고객 상호작용 제거 - CloseButton 스타일 제거

const AIRecommendationDisplay = ({
  recommendations = [],
  confidence = 0,
  customerName = "고객님",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      setIsVisible(true);
    }
  }, [recommendations]);

  const formatAmount = (amount) => {
    if (!amount) return "정보 없음";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  const formatInterestRate = (rate) => {
    if (!rate) return "정보 없음";
    return rate.toFixed(2) + "%";
  };

  if (!isVisible || !recommendations || recommendations.length === 0) {
    return null;
  }

  // 최대 3개 상품만 표시
  const displayRecommendations = recommendations.slice(0, 3);

  return (
    <AnimatePresence>
      <RecommendationContainer
        as={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header>
          <Title>AI 추천 서비스</Title>
          <Subtitle>{customerName}님을 위한 맞춤 금융상품</Subtitle>
        </Header>

        <ConfidenceIndicator>
          <ConfidenceText>추천 신뢰도</ConfidenceText>
          <ConfidenceBar>
            <ConfidenceFill confidence={confidence} />
          </ConfidenceBar>
          <ConfidenceText>{Math.round(confidence * 100)}%</ConfidenceText>
        </ConfidenceIndicator>

        <RecommendationGrid>
          {displayRecommendations.map((product, index) => (
            <ProductCard
              key={product.productId || index}
              as={motion.div}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <ProductHeader>
                <ProductName>{product.productName}</ProductName>
                <ScoreBadge>
                  {Math.round((product.score || 0) * 100)}점
                </ScoreBadge>
              </ProductHeader>

              <ProductType>{product.productType}</ProductType>

              <InterestRate>
                <RateValue>
                  {formatInterestRate(product.interestRate)}
                </RateValue>
                <RateLabel>기본 금리</RateLabel>
              </InterestRate>

              <ProductDetails>
                <DetailRow>
                  <DetailLabel>최소 금액</DetailLabel>
                  <DetailValue>{formatAmount(product.minAmount)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>최대 금액</DetailLabel>
                  <DetailValue>{formatAmount(product.maxAmount)}</DetailValue>
                </DetailRow>
              </ProductDetails>

              {product.reason && (
                <RecommendationReason>
                  <ReasonTitle>💡 추천 이유</ReasonTitle>
                  <ReasonText>{product.reason}</ReasonText>
                </RecommendationReason>
              )}
            </ProductCard>
          ))}
        </RecommendationGrid>
      </RecommendationContainer>
    </AnimatePresence>
  );
};

export default AIRecommendationDisplay;
