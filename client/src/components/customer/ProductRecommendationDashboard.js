import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";

const DashboardContainer = styled.div`
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Title = styled.h1`
  color: #1e3c72;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: #6c757d;
  font-size: 16px;
  margin: 0;
`;

const RecommendationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid
    ${(props) =>
      props.score > 0.8
        ? "#28a745"
        : props.score > 0.6
        ? "#ffc107"
        : "#17a2b8"};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const ProductName = styled.h3`
  color: #1e3c72;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  flex: 1;
`;

const ScoreBadge = styled.div`
  background: ${(props) =>
    props.score > 0.8 ? "#28a745" : props.score > 0.6 ? "#ffc107" : "#17a2b8"};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 12px;
`;

const ProductType = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const ProductDetails = styled.div`
  margin: 16px 0;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

const DetailLabel = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #212529;
  font-weight: 600;
`;

const RecommendationReason = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  border-left: 3px solid #1e3c72;
`;

const ReasonTitle = styled.h4`
  color: #1e3c72;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const ReasonText = styled.p`
  color: #495057;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #f5c6cb;
`;

const RefreshButton = styled.button`
  background: #1e3c72;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #2a5298;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const ProductRecommendationDashboard = ({ customerId, customerName }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setError(null);

      // 먼저 고급 RAG 추천을 시도
      try {
        const advancedResponse = await axios.get(
          `/api/employee/customers/recommendations/advanced/customer/${customerId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (advancedResponse.data && advancedResponse.data.recommendations) {
          setRecommendations(advancedResponse.data.recommendations);
          return;
        }
      } catch (advancedErr) {
        console.log(
          "고급 RAG 추천 실패, 기본 추천으로 전환:",
          advancedErr.message
        );
      }

      // 고급 추천이 실패하면 기본 추천 사용
      const response = await axios.get(
        `/api/employee/customers/recommendations/working/customer/${customerId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      }
    } catch (err) {
      console.error("상품 추천 조회 오류:", err);
      setError("상품 추천을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  useEffect(() => {
    if (customerId) {
      fetchRecommendations();
    }
  }, [customerId]);

  const formatAmount = (amount) => {
    if (!amount) return "미상";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  const formatRate = (rate) => {
    if (!rate) return "미상";
    return rate + "%";
  };

  const getScoreColor = (score) => {
    if (score > 0.8) return "#28a745";
    if (score > 0.6) return "#ffc107";
    return "#17a2b8";
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Header>
          <Title>맞춤 상품 추천</Title>
          <Subtitle>고객님께 최적화된 금융 상품을 추천해드립니다</Subtitle>
        </Header>
        <LoadingSpinner>상품 추천을 불러오는 중...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title>맞춤 상품 추천</Title>
            <Subtitle>
              {customerName
                ? `${customerName}님께 최적화된 금융 상품을 추천해드립니다`
                : "고객님께 최적화된 금융 상품을 추천해드립니다"}
            </Subtitle>
          </div>
          <RefreshButton onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "새로고침 중..." : "새로고침"}
          </RefreshButton>
        </div>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {recommendations.length === 0 && !error ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
          <h3>추천할 상품이 없습니다</h3>
          <p>
            고객 정보를 더 자세히 입력해주시면 더 정확한 추천을 받으실 수
            있습니다.
          </p>
        </div>
      ) : (
        <RecommendationGrid>
          {recommendations.map((product, index) => (
            <ProductCard
              key={product.productId}
              score={product.recommendationScore || 0}
            >
              <ProductHeader>
                <div style={{ flex: 1 }}>
                  <ProductName>{product.productName}</ProductName>
                  <ProductType>{product.productType}</ProductType>
                </div>
                <ScoreBadge score={product.recommendationScore || 0}>
                  추천도 {Math.round((product.recommendationScore || 0) * 100)}%
                </ScoreBadge>
              </ProductHeader>

              <ProductDetails>
                <DetailRow>
                  <DetailLabel>기본 금리</DetailLabel>
                  <DetailValue>{formatRate(product.baseRate)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>최소 금액</DetailLabel>
                  <DetailValue>{formatAmount(product.minAmount)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>최대 금액</DetailLabel>
                  <DetailValue>{formatAmount(product.maxAmount)}</DetailValue>
                </DetailRow>
              </ProductDetails>

              {product.description && (
                <div
                  style={{
                    margin: "16px 0",
                    fontSize: "14px",
                    color: "#495057",
                    lineHeight: "1.5",
                  }}
                >
                  {product.description.length > 100
                    ? product.description.substring(0, 100) + "..."
                    : product.description}
                </div>
              )}

              {product.recommendationReason && (
                <RecommendationReason>
                  <ReasonTitle>추천 이유</ReasonTitle>
                  <ReasonText>{product.recommendationReason}</ReasonText>
                </RecommendationReason>
              )}
            </ProductCard>
          ))}
        </RecommendationGrid>
      )}
    </DashboardContainer>
  );
};

export default ProductRecommendationDashboard;
