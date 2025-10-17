import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { getApiUrl } from "../../config/api";
import ProductComparisonChart from "../common/ProductComparisonChart";
import ProductAnalysisModal from "../common/ProductAnalysisModal";

const SimulationContainer = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: "Hana2-Regular", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
`;

const SimulationHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

  &::before {
    content: "💰";
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 3rem;
    opacity: 0.4;
  }
`;

const SimulationTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SimulationSubtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.95;
  line-height: 1.5;
`;

const SimulationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const ProductRankingPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  height: 650px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

const ProductRankingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem;
  background: ${(props) =>
    props.isSelected ? "rgba(102, 126, 234, 0.1)" : "#f8fafc"};
  border: ${(props) =>
    props.isSelected ? "2px solid #667eea" : "1px solid #e2e8f0"};
  border-radius: 12px;
  margin-bottom: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${(props) =>
      props.isSelected
        ? "rgba(102, 126, 234, 0.15)"
        : "rgba(102, 126, 234, 0.05)"};
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    border-color: #667eea;
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  }
`;

const ProductRankingInfo = styled.div`
  flex: 1;
`;

const ProductRankingName = styled.div`
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.4rem;
  font-size: 1rem;
  line-height: 1.3;
`;

const ProductRankingType = styled.div`
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 0.4rem;
  font-weight: 500;
`;

const ProductRankingRates = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
`;

const ProductRankingBaseRate = styled.span`
  color: #718096;
  font-weight: 500;
`;

const ProductRankingPreferentialRate = styled.span`
  color: #38a169;
  font-weight: 600;
`;

const ProductRankingFinalRate = styled.span`
  color: #667eea;
  font-weight: 700;
  font-size: 0.9rem;
`;

const ProductRankingPosition = styled.div`
  background: ${(props) => {
    if (props.position === 1)
      return "linear-gradient(135deg, #FFD700, #FFA500)";
    if (props.position === 2)
      return "linear-gradient(135deg, #C0C0C0, #A0A0A0)";
    if (props.position === 3)
      return "linear-gradient(135deg, #CD7F32, #B8860B)";
    return "linear-gradient(135deg, #667eea, #764ba2)";
  }};
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  margin-left: 1rem;
`;

const ConditionsPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  height: 650px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

const SectionTitle = styled.h3`
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ScrollableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--hana-mint);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--hana-mint-dark);
  }
`;

const ConditionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConditionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem;
  background: ${(props) =>
    props.isSelected ? "rgba(102, 126, 234, 0.1)" : "#f8fafc"};
  border: ${(props) =>
    props.isSelected ? "2px solid #667eea" : "1px solid #e2e8f0"};
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.isSelected
      ? "0 8px 25px rgba(102, 126, 234, 0.15)"
      : "0 2px 8px rgba(0, 0, 0, 0.05)"};
  cursor: pointer;

  &:hover {
    background: ${(props) =>
      props.isSelected
        ? "rgba(102, 126, 234, 0.15)"
        : "rgba(102, 126, 234, 0.05)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    border-color: #667eea;
  }
`;

const ConditionInfo = styled.div`
  flex: 1;
`;

const ConditionName = styled.div`
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.4rem;
  font-size: 1rem;
`;

const ConditionDescription = styled.div`
  font-size: 0.9rem;
  color: #718096;
  line-height: 1.4;
`;

const ConditionRate = styled.div`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 0.5rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
`;

const StatusIndicator = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(props) => (props.isSelected ? "#38a169" : "#e2e8f0")};
  margin-left: 0.5rem;
  border: 2px solid ${(props) => (props.isSelected ? "#667eea" : "transparent")};
  transition: all 0.3s ease;
`;

const ResultsPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResultCard = styled.div`
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ResultLabel = styled.div`
  font-size: 1rem;
  opacity: 0.95;
  margin-bottom: 0.8rem;
  position: relative;
  z-index: 1;
  font-weight: 500;
`;

const ResultValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BenefitsList = styled.div`
  margin-top: 1.5rem;
`;

const BenefitItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 0.8rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.05);
    border-color: #667eea;
    transform: translateY(-1px);
  }
`;

const BenefitName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 1rem;
`;

const BenefitValue = styled.div`
  font-weight: 700;
  color: #667eea;
  font-size: 1.1rem;
`;

const formatRate = (rate) => {
  return rate ? rate.toFixed(2) + "%" : "0.00%";
};

const TabletSimulationView = ({ simulationData }) => {
  // 데이터 미도착 시에도 UI를 즉시 표시하고, 값은 도착하는 대로 채움
  // 성능 최적화를 위한 메모이제이션
  const safeData = simulationData || {};

  const {
    selectedProduct,
    simulationResult,
    selectedConditions = [],
    customer = {},
    rankedProducts = [],
  } = safeData;

  const allConditions = safeData.conditions || [];

  // 로컬 상태: API에서 직접 불러온 데이터 (백업 및 초기 표시용)
  const [productsLocal, setProductsLocal] = useState([]);
  const [conditionsLocal, setConditionsLocal] = useState([]);
  const [rankedLocal, setRankedLocal] = useState([]);
  const [selectedConditionsLocal, setSelectedConditionsLocal] =
    useState(selectedConditions);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // 외부에서 들어오는 선택 상태를 로컬 선택 상태에 반영
  useEffect(() => {
    setSelectedConditionsLocal(
      Array.isArray(selectedConditions) ? selectedConditions : []
    );
  }, [selectedConditions]);

  // API로 상품/조건을 가져오기 (초기 진입 시)
  useEffect(() => {
    let cancelled = false;

    const fetchConditions = async () => {
      try {
        const res = await axios.get(
          getApiUrl("/api/employee/products/preferential-conditions")
        );
        const data = res.data?.data || res.data || [];
        const formatted = data.map((condition, index) => ({
          ConditionID: index + 1,
          ConditionName: condition.condition_name,
          Description: condition.description,
          PreferentialRate: condition.rate_value || 0,
          RateDisplay: condition.rate_display,
        }));
        if (!cancelled) setConditionsLocal(formatted);
      } catch (e) {
        // noop (초기엔 없어도 UI는 떠야 함)
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await axios.get(
          getApiUrl("/api/employee/products/details")
        );
        const data = res.data?.data || res.data || [];
        if (!cancelled) setProductsLocal(data);
      } catch (e) {
        // noop
      }
    };

    fetchConditions();
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  // 로컬 랭킹 계산
  useEffect(() => {
    if (!productsLocal || productsLocal.length === 0) {
      setRankedLocal([]);
      return;
    }

    const calculateProductRankings = (
      products,
      selectedConditionIds,
      conditionsRef
    ) => {
      const ranked = products
        .map((product) => {
          // 기본 금리 계산
          let baseRate = 2.0;
          if (product.basic_rates) {
            let basicRatesData = product.basic_rates;
            try {
              if (typeof basicRatesData === "object" && basicRatesData.value) {
                basicRatesData = JSON.parse(basicRatesData.value);
              }
            } catch {}
            if (basicRatesData && basicRatesData.description) {
              const rateMatch = String(basicRatesData.description).match(
                /(\d+\.?\d*)/
              );
              if (rateMatch) baseRate = parseFloat(rateMatch[1]);
            }
          }

          // 우대금리 합산
          let totalPreferentialRate = 0;
          const applicableConditions = [];

          let preferentialRates = [];
          try {
            if (
              product.preferential_rates &&
              typeof product.preferential_rates === "object" &&
              product.preferential_rates.value
            ) {
              preferentialRates = JSON.parse(product.preferential_rates.value);
            } else if (Array.isArray(product.preferential_rates)) {
              preferentialRates = product.preferential_rates;
            }
          } catch {}

          if (Array.isArray(preferentialRates)) {
            (selectedConditionIds || []).forEach((cid) => {
              const cond = (conditionsRef || []).find(
                (c) => c.ConditionID === cid
              );
              if (cond) {
                const match = preferentialRates.find(
                  (r) => r.item === cond.ConditionName
                );
                if (match) {
                  const rateVal = match.rate_value || 0;
                  totalPreferentialRate += rateVal;
                  applicableConditions.push({
                    ...cond,
                    actualRate: rateVal,
                    actualRateDisplay: match.rate,
                  });
                }
              }
            });
          }

          const finalRate = baseRate + totalPreferentialRate;
          return {
            ...product,
            baseRate,
            totalPreferentialRate,
            finalRate,
            applicableConditions,
            productName: product.product_name || product.ProductName,
            productType: product.category || product.ProductType,
          };
        })
        .sort((a, b) => (b.finalRate || 0) - (a.finalRate || 0));

      return ranked;
    };

    const ranked = calculateProductRankings(
      productsLocal,
      selectedConditionsLocal,
      conditionsLocal
    );
    setRankedLocal(ranked);
  }, [productsLocal, conditionsLocal, selectedConditionsLocal]);

  // 선택된 조건들의 상세 정보
  const selectedConditionDetails = selectedConditions
    .map((conditionId) => {
      // rankedProducts에서 조건 정보 찾기
      for (const product of rankedProducts) {
        if (product.applicableConditions) {
          const condition = product.applicableConditions.find(
            (c) => c.ConditionID === conditionId
          );
          if (condition) return condition;
        }
      }
      return null;
    })
    .filter(Boolean);

  const rankedProductsDisplay =
    Array.isArray(rankedProducts) && rankedProducts.length > 0
      ? rankedProducts
      : rankedLocal;

  const conditionsDisplay =
    Array.isArray(allConditions) && allConditions.length > 0
      ? allConditions
      : conditionsLocal;

  console.log("🔍 [TabletSimulationView] 렌더링 데이터:", {
    selectedProduct,
    selectedConditions: selectedConditionsLocal,
    selectedConditionDetails: selectedConditionDetails.length,
    rankedProducts: rankedProductsDisplay.length,
    simulationResult,
  });

  return (
    <SimulationContainer>
      <SimulationHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <SimulationTitle>통합 혜택 시뮬레이터</SimulationTitle>
            <SimulationSubtitle>
              {customer.Name || "고객"}님의 조건에 맞는 최적의 금융 혜택을
              분석하고 있습니다
            </SimulationSubtitle>
          </div>
        </div>
      </SimulationHeader>

      <SimulationGrid>
        <ProductRankingPanel>
          <SectionTitle>🏆 상품 우대금리 순위</SectionTitle>
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.9rem",
              color: "var(--hana-dark-gray)",
            }}
          >
            조건에 따라 실시간으로 순위가 변경됩니다
          </div>

          <ScrollableContainer>
            {rankedProductsDisplay.slice(0, 10).map((product, index) => (
              <ProductRankingItem
                key={product.id || product.ProductID}
                isSelected={
                  selectedProduct?.id === product.id ||
                  selectedProduct?.ProductID === product.ProductID
                }
                onClick={() => {
                  // 태블릿에서는 읽기 전용이므로 클릭 시 시각적 피드백만 제공
                  console.log("상품 선택됨:", product.productName);
                }}
                style={{ cursor: "pointer" }}
              >
                <ProductRankingInfo>
                  <ProductRankingName>{product.productName}</ProductRankingName>
                  <ProductRankingType>{product.productType}</ProductRankingType>
                  <ProductRankingRates>
                    <ProductRankingBaseRate>
                      기본: {product.baseRate?.toFixed(2) || "0.00"}%
                    </ProductRankingBaseRate>
                    {product.totalPreferentialRate > 0 && (
                      <ProductRankingPreferentialRate>
                        우대: +{product.totalPreferentialRate.toFixed(2)}%
                      </ProductRankingPreferentialRate>
                    )}
                    <ProductRankingFinalRate>
                      최종: {product.finalRate?.toFixed(2) || "0.00"}%
                    </ProductRankingFinalRate>
                  </ProductRankingRates>
                </ProductRankingInfo>
                <ProductRankingPosition position={index + 1}>
                  {index + 1}
                </ProductRankingPosition>
              </ProductRankingItem>
            ))}
          </ScrollableContainer>
        </ProductRankingPanel>

        <ConditionsPanel>
          <SectionTitle>⚙️ 우대금리 조건 설정</SectionTitle>
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.9rem",
              color: "var(--hana-dark-gray)",
            }}
          >
            행원이 선택한 조건들이 표시됩니다
          </div>

          <ScrollableContainer>
            <ConditionsList>
              {(conditionsDisplay.length > 0
                ? conditionsDisplay
                : selectedConditionDetails
              ).map((condition, index) => {
                const isSelected = selectedConditionsLocal.includes(
                  condition.ConditionID
                );
                const rateValue =
                  condition.actualRate ?? condition.PreferentialRate ?? 0;
                return (
                  <ConditionItem key={index} isSelected={isSelected}>
                    <ConditionInfo>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <ConditionName>{condition.ConditionName}</ConditionName>
                        <ConditionRate>+{rateValue.toFixed(2)}%</ConditionRate>
                      </div>
                      <ConditionDescription>
                        {condition.Description}
                      </ConditionDescription>
                    </ConditionInfo>
                    <StatusIndicator isSelected={isSelected} />
                  </ConditionItem>
                );
              })}
            </ConditionsList>
          </ScrollableContainer>
        </ConditionsPanel>
      </SimulationGrid>

      {simulationResult && (
        <ResultsPanel>
          <SectionTitle>📊 시뮬레이션 결과</SectionTitle>

          <ResultsGrid>
            <ResultCard>
              <ResultLabel>기본 금리</ResultLabel>
              <ResultValue>
                {formatRate(simulationResult.baseInterestRate)}
              </ResultValue>
              {simulationResult.actualRateUsed && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#4caf50",
                    fontWeight: "bold",
                    marginTop: "4px",
                  }}
                >
                  🔄 {simulationResult.rateSource}
                </div>
              )}
            </ResultCard>
            <ResultCard>
              <ResultLabel>최종 금리</ResultLabel>
              <ResultValue>
                {formatRate(simulationResult.totalInterestRate)}
              </ResultValue>
            </ResultCard>
            <ResultCard>
              <ResultLabel>우대 혜택</ResultLabel>
              <ResultValue>
                +
                {formatRate(
                  simulationResult.totalInterestRate -
                    simulationResult.baseInterestRate
                )}
              </ResultValue>
            </ResultCard>
          </ResultsGrid>

          {simulationResult.benefits &&
            simulationResult.benefits.length > 0 && (
              <div>
                <h4 style={{ color: "var(--hana-mint)", marginBottom: "1rem" }}>
                  적용된 혜택
                </h4>
                <BenefitsList>
                  {simulationResult.benefits.map((benefit, index) => (
                    <BenefitItem key={index}>
                      <BenefitName>{benefit.BenefitName}</BenefitName>
                      <BenefitValue>
                        {benefit.BenefitType === "Interest Rate" &&
                          `+${benefit.ApplicableValue}%`}
                        {benefit.BenefitType === "Fee Discount" &&
                          "수수료 면제"}
                        {benefit.BenefitType === "Points" &&
                          `${benefit.ApplicableValue}P`}
                        {benefit.BenefitType === "Cashback" &&
                          `${benefit.ApplicableValue}% 캐시백`}
                      </BenefitValue>
                    </BenefitItem>
                  ))}
                </BenefitsList>
              </div>
            )}
        </ResultsPanel>
      )}

      {/* 분석 버튼 */}
      {selectedProduct && rankedProductsDisplay.length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
          }}
        >
          <button
            onClick={() => setShowAnalysisModal(true)}
            style={{
              background:
                "linear-gradient(135deg, var(--hana-mint) 0%, var(--hana-mint-dark) 100%)",
              color: "white",
              border: "none",
              padding: "1rem 2rem",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(0, 132, 133, 0.3)",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 20px rgba(0, 132, 133, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 132, 133, 0.3)";
            }}
          >
            📊 12개월 자산 현황 비교 분석 보기
          </button>
        </div>
      )}

      {/* 상품 분석 모달 */}
      <ProductAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        selectedProducts={rankedProductsDisplay.slice(0, 2)}
        customerProduct={selectedProduct}
        simulationAmount={1000000}
        simulationPeriod={12}
      />
    </SimulationContainer>
  );
};

export default TabletSimulationView;
