import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

const ChartContainer = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  @keyframes chartFadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes dotPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  color: var(--hana-mint);
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ControlLabel = styled.label`
  font-size: 0.8rem;
  color: var(--hana-dark-gray);
  font-weight: 500;
`;

const ControlInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 120px;

  &:focus {
    outline: none;
    border-color: var(--hana-mint);
  }
`;

const ProductSelector = styled.select`
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: var(--hana-mint);
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div`
  background: ${(props) => {
    if (props.isBest) return "linear-gradient(135deg, #4CAF50, #45a049)";
    if (props.isWorst) return "linear-gradient(135deg, #f44336, #d32f2f)";
    return "linear-gradient(135deg, var(--hana-mint-light), var(--hana-mint))";
  }};
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

const SummaryCardContent = styled.div`
  position: relative;
  z-index: 1;
`;

const SummaryCardTitle = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const SummaryCardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const SummaryCardSubtitle = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const RecommendationBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
`;

const ProductComparisonChart = ({
  customerProduct,
  recommendedProducts = [],
  initialAmount = 1000000,
  initialPeriod = 12,
}) => {
  // 렌더링 로그는 개발 모드에서만 표시
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 [ProductComparisonChart] 렌더링됨");
  }

  const [simulationAmount, setSimulationAmount] = useState(initialAmount);
  const [simulationPeriod, setSimulationPeriod] = useState(initialPeriod);
  const [selectedRecommendedProduct, setSelectedRecommendedProduct] =
    useState(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // 고객이 원하는 상품과 추천 상품들을 포함한 모든 상품 목록
  const allProducts = useMemo(() => {
    // 개발 모드에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [ProductComparisonChart] allProducts 계산 중...");
    }

    // 입력 데이터 유효성 검사
    if (
      !customerProduct &&
      (!recommendedProducts || recommendedProducts.length === 0)
    ) {
      console.warn("⚠️ [ProductComparisonChart] 비교할 상품 데이터가 없습니다");
      return [];
    }

    const products = [];

    if (customerProduct) {
      products.push({
        ...customerProduct,
        isCustomerChoice: true,
        name:
          customerProduct.productName ||
          customerProduct.ProductName ||
          "고객 선택 상품",
        rate: customerProduct.finalRate || customerProduct.baseRate || 2.0,
        color: "#FF6B6B", // 빨간색 - 고객 선택
      });
    }

    recommendedProducts.forEach((product, index) => {
      const baseName =
        product.productName ||
        product.product_name ||
        product.ProductName ||
        `추천 상품 ${index + 1}`;
      let uniqueName = baseName;
      let counter = 1;

      // 중복된 이름이 있는지 확인하고 고유한 이름 생성
      while (products.some((p) => p.name === uniqueName)) {
        uniqueName = `${baseName} (${counter})`;
        counter++;
      }

      // 이미 동일한 상품이 있는지 확인 (ID 기반)
      const productId = product.id || product.ProductID || product.productId;
      const isDuplicate = products.some((p) => {
        const existingId = p.id || p.ProductID || p.productId;
        return existingId && productId && existingId === productId;
      });

      if (!isDuplicate) {
        products.push({
          ...product,
          isCustomerChoice: false,
          name: uniqueName,
          rate: product.finalRate || product.baseRate || 2.0,
          color: index === 0 ? "#4ECDC4" : index === 1 ? "#45B7D1" : "#96CEB4", // 추천 상품들
        });
      }
    });

    return products;
  }, [customerProduct, recommendedProducts]);

  // 12개월 자산 현황 데이터 생성
  const chartData = useMemo(() => {
    // 개발 모드에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [ProductComparisonChart] chartData 계산 중...");
    }
    const data = [];

    for (let month = 1; month <= simulationPeriod; month++) {
      const monthData = { month: `${month}개월` };

      allProducts.forEach((product) => {
        // 복리 계산 (월 단위)
        const monthlyRate = product.rate / 100 / 12;
        const compoundAmount =
          simulationAmount * Math.pow(1 + monthlyRate, month);
        const interest = compoundAmount - simulationAmount;

        monthData[product.name] = Math.round(compoundAmount);
        monthData[`${product.name}_interest`] = Math.round(interest);
      });

      data.push(monthData);
    }

    return data;
  }, [allProducts, simulationAmount, simulationPeriod]);

  // 최종 수익 비교 데이터 (메모이제이션 강화)
  const finalComparison = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const comparison = allProducts.map((product) => {
      const monthlyRate = product.rate / 100 / 12;
      const finalAmount =
        simulationAmount * Math.pow(1 + monthlyRate, simulationPeriod);
      const totalInterest = finalAmount - simulationAmount;
      const interestRate = (totalInterest / simulationAmount) * 100;

      return {
        ...product,
        finalAmount: Math.round(finalAmount),
        totalInterest: Math.round(totalInterest),
        interestRate: interestRate,
      };
    });

    // 수익률 순으로 정렬
    return comparison.sort((a, b) => b.totalInterest - a.totalInterest);
  }, [allProducts, simulationAmount, simulationPeriod]);

  // 애니메이션 완료 후 안정성 확보
  useEffect(() => {
    setAnimationCompleted(false); // 새 데이터가 들어올 때 애니메이션 상태 리셋

    const timer = setTimeout(() => {
      setAnimationCompleted(true);
    }, Math.max(2000 + (allProducts?.length || 0) * 300, 3000)); // 모든 라인 애니메이션 완료 후

    return () => clearTimeout(timer);
  }, [allProducts?.length, simulationAmount, simulationPeriod]);

  // 최고/최저 수익 상품 찾기
  const bestProduct = finalComparison[0];
  const worstProduct = finalComparison[finalComparison.length - 1];

  // 차트 색상 설정
  const colors = {
    [customerProduct?.productName ||
    customerProduct?.ProductName ||
    "고객 선택 상품"]: "#FF6B6B",
  };

  recommendedProducts.forEach((product, index) => {
    const productName =
      product.productName ||
      product.product_name ||
      product.ProductName ||
      `추천 상품 ${index + 1}`;
    colors[productName] =
      index === 0 ? "#4ECDC4" : index === 1 ? "#45B7D1" : "#96CEB4";
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontWeight: "600",
              color: "#2c3e50",
            }}
          >
            {label}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              style={{
                margin: "0.25rem 0",
                color: entry.color,
                fontSize: "0.9rem",
              }}
            >
              <span style={{ fontWeight: "600" }}>{entry.dataKey}:</span>{" "}
              {entry.value.toLocaleString()}원
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 상품이 없을 때 처리
  if (allProducts.length === 0) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>📈 12개월 자산 현황 비교</ChartTitle>
        </ChartHeader>
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#6c757d",
            fontSize: "1.1rem",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h3 style={{ margin: "0 0 1rem 0", color: "#495057" }}>
            비교할 상품이 없습니다
          </h3>
          <p>상품을 선택한 후 비교분석을 실행해주세요.</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>📈 12개월 자산 현황 비교</ChartTitle>
        <ChartControls>
          <ControlGroup>
            <ControlLabel>투자 금액</ControlLabel>
            <ControlInput
              type="number"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(Number(e.target.value))}
              min="100000"
              step="100000"
            />
          </ControlGroup>
          <ControlGroup>
            <ControlLabel>기간 (개월)</ControlLabel>
            <ControlInput
              type="number"
              value={simulationPeriod}
              onChange={(e) => setSimulationPeriod(Number(e.target.value))}
              min="1"
              max="60"
            />
          </ControlGroup>
        </ChartControls>
      </ChartHeader>

      {/* 요약 카드 */}
      <SummaryCards>
        {finalComparison.map((product, index) => (
          <SummaryCard
            key={product.name}
            isBest={index === 0}
            isWorst={index === finalComparison.length - 1}
          >
            <SummaryCardContent>
              <SummaryCardTitle>
                {product.isCustomerChoice ? "🎯 고객 선택" : "💡 추천 상품"}
              </SummaryCardTitle>
              <SummaryCardValue>
                {product.totalInterest.toLocaleString()}원
              </SummaryCardValue>
              <SummaryCardSubtitle>
                {product.name} ({product.rate.toFixed(2)}%)
              </SummaryCardSubtitle>
              {index === 0 && (
                <RecommendationBadge>🏆 최고 수익</RecommendationBadge>
              )}
            </SummaryCardContent>
          </SummaryCard>
        ))}
      </SummaryCards>

      {/* 꺽은선 그래프 */}
      <div
        style={{
          height: "400px",
          marginBottom: "2rem",
          animation: "chartFadeIn 1.5s ease-in-out",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(155, 89, 182, 0.05))",
          borderRadius: "15px",
          padding: "15px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis dataKey="month" stroke="#6c757d" fontSize={12} />
            <YAxis
              stroke="#6c757d"
              fontSize={12}
              tickFormatter={(value) => `${(value / 10000).toFixed(0)}만원`}
              domain={(() => {
                // 차트 데이터에서 최소/최대값 계산
                const amounts = chartData.flatMap((monthData) =>
                  allProducts.map((product) => monthData[product.name] || 0)
                );
                const minAmount = Math.min(...amounts);
                const maxAmount = Math.max(...amounts);

                // Y축 범위를 매우 좁게 조정하여 작은 차이도 명확하게 표시
                const range = maxAmount - minAmount;

                // 범위가 너무 작으면 최소 2% 차이를 보장
                const minRange = Math.max(range, simulationAmount * 0.02);
                const center = (minAmount + maxAmount) / 2;

                const domainMin = Math.max(0, center - minRange * 0.6);
                const domainMax = center + minRange * 0.6;

                return [domainMin, domainMax];
              })()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {allProducts.map((product, index) => (
              <Line
                key={`${product.name}-${
                  product.id || index
                }-${simulationAmount}-${simulationPeriod}`} // 더 고유한 key로 리렌더링 방지
                type="monotone"
                dataKey={product.name}
                stroke={product.color}
                strokeWidth={4}
                dot={{
                  fill: product.color,
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{
                  r: 8,
                  stroke: product.color,
                  strokeWidth: 3,
                  fill: "#fff",
                }}
                name={product.name}
                animationDuration={animationCompleted ? 0 : 2000 + index * 200} // 애니메이션 완료 후에는 즉시 렌더링
                animationEasing="ease-out"
                isAnimationActive={!animationCompleted} // 애니메이션 완료 후에는 비활성화
                animationBegin={animationCompleted ? 0 : index * 150} // 순차적 애니메이션 시작
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 상세 비교 정보 */}
      <div style={{ marginTop: "2rem" }}>
        <h4 style={{ color: "var(--hana-mint)", marginBottom: "1rem" }}>
          💰 상세 수익 비교
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {finalComparison.map((product, index) => (
            <div
              key={product.name}
              style={{
                background:
                  index === 0
                    ? "linear-gradient(135deg, #4CAF50, #45a049)"
                    : index === finalComparison.length - 1
                    ? "linear-gradient(135deg, #f44336, #d32f2f)"
                    : "linear-gradient(135deg, var(--hana-mint-light), var(--hana-mint))",
                color: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h5 style={{ margin: 0, fontSize: "1.1rem" }}>
                  {product.isCustomerChoice ? "🎯" : "💡"} {product.name}
                </h5>
                {index === 0 && (
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    🏆 최고 수익
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <div style={{ opacity: 0.8, marginBottom: "0.25rem" }}>
                    금리
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                    {product.rate.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ opacity: 0.8, marginBottom: "0.25rem" }}>
                    총 수익
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                    {product.totalInterest.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div style={{ opacity: 0.8, marginBottom: "0.25rem" }}>
                    최종 금액
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                    {product.finalAmount.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div style={{ opacity: 0.8, marginBottom: "0.25rem" }}>
                    수익률
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                    {product.interestRate.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 메시지 */}
      {bestProduct && worstProduct && bestProduct !== worstProduct && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #4CAF50, #45a049)",
            color: "white",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
            💡 추천 결과
          </h4>
          <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>
            <strong>{bestProduct.name}</strong>이 {worstProduct.name}보다{" "}
            <strong>
              {(
                bestProduct.totalInterest - worstProduct.totalInterest
              ).toLocaleString()}
              원
            </strong>{" "}
            더 많은 수익을 제공합니다.
            {bestProduct.isCustomerChoice
              ? " 고객님의 선택이 최적입니다! 🎉"
              : " 이 상품을 추천드립니다! ✨"}
          </p>
        </div>
      )}
    </ChartContainer>
  );
};

export default ProductComparisonChart;
