import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;

  /* 태블릿에서 모달 크기 최대화 */
  @media (min-width: 768px) {
    width: 95%;
    max-width: 1400px;
    max-height: 95vh;
  }

  /* PWA 모드에서 추가 최적화 */
  @media (display-mode: standalone) {
    width: 98%;
    max-width: 1600px;
    max-height: 98vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  z-index: 10;

  &:hover {
    background: #e0e0e0;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 30px;
  border-radius: 16px 16px 0 0;
  text-align: center;
`;

const ProductTitle = styled.h2`
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
`;

const ProductSubtitle = styled.p`
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
`;

const Content = styled.div`
  padding: 30px;
`;

const Section = styled.div`
  margin-bottom: 30px;
  padding: 25px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #1e3a8a;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const FeatureTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 600;
`;

const FeatureValue = styled.p`
  margin: 0;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.5;
`;

const RateCard = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin: 10px 0;
`;

const RateValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const RateLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const SimulationCard = styled.div`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
`;

const ConditionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ConditionItem = styled.li`
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 10px;

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: "✓";
    color: #10b981;
    font-weight: bold;
    font-size: 16px;
  }
`;

const RateSelectionCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin: 10px 0;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  padding: 10px;
  border-radius: 6px;
  background: ${(props) => (props.selected ? "#f0f9ff" : "#f8fafc")};
  border: 1px solid ${(props) => (props.selected ? "#3b82f6" : "#e2e8f0")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    border-color: #3b82f6;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  flex: 1;
`;

const RateValueSpan = styled.span`
  font-weight: 600;
  color: #1e3a8a;
  font-size: 16px;
`;

const ChartContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
  min-height: 450px;
  display: flex;
  flex-direction: column;
`;

const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  stompClient,
  sessionId,
  isTablet = false,
  simulationData: propSimulationData,
  selectedRates: propSelectedRates = [],
  chartData: propChartData = [],
  compoundComparisonData: propCompoundComparisonData = [],
  rateOptions = [],
}) => {
  const [simulationData, setSimulationData] = useState(propSimulationData);
  const [selectedRates, setSelectedRates] = useState(propSelectedRates);
  const [chartData, setChartData] = useState(propChartData);
  const [compoundComparisonData, setCompoundComparisonData] = useState(
    propCompoundComparisonData
  );

  // 우대금리 옵션을 상태로 관리
  const [rateOptionsState, setRateOptionsState] = useState(() => {
    return rateOptions.length > 0
      ? rateOptions
      : [
          {
            id: "salary",
            name: "급여이체 우대",
            rate: 1.0,
            description: "급여이체 시 1.0%p 추가",
          },
          {
            id: "card",
            name: "하나카드 결제",
            rate: 0.5,
            description: "하나카드 결제 시 0.5%p 추가",
          },
          {
            id: "event",
            name: "이벤트 특별금리",
            rate: 3.5,
            description: "이벤트 특별금리 최고 3.5%p 추가",
          },
          {
            id: "online",
            name: "온라인 가입",
            rate: 0.2,
            description: "온라인 가입 시 0.2%p 추가",
          },
        ];
  });

  // 실제 우대금리 데이터가 있는지 확인
  const hasRealBenefits =
    rateOptionsState.length > 0 &&
    rateOptionsState[0].id.startsWith("preferential_");

  // 디버깅을 위한 로그
  console.log("🔍 ProductDetailModal - rateOptions:", rateOptions);
  console.log("🔍 ProductDetailModal - hasRealBenefits:", hasRealBenefits);
  console.log("🔍 ProductDetailModal - isTablet:", isTablet);

  // props로 받은 데이터가 있으면 로컬 상태 업데이트
  useEffect(() => {
    if (propSimulationData) setSimulationData(propSimulationData);
    if (propSelectedRates.length > 0) setSelectedRates(propSelectedRates);
    if (propChartData.length > 0) setChartData(propChartData);
    if (propCompoundComparisonData.length > 0)
      setCompoundComparisonData(propCompoundComparisonData);
    if (rateOptions.length > 0) {
      setRateOptionsState(rateOptions);
    }
  }, [
    propSimulationData,
    propSelectedRates,
    propChartData,
    propCompoundComparisonData,
    rateOptions,
  ]);

  // 시뮬레이션 데이터 생성
  useEffect(() => {
    if (product && isOpen && !propSimulationData) {
      const generateSimulation = () => {
        const amount = 5000000; // 500만원
        const period = 12; // 12개월
        const baseRate =
          parseFloat(product.interest_rate?.replace("%", "")) || 2.75;

        // 상품 타입 확인
        const productType =
          product?.productType || product?.product_type || "적금";

        // 선택된 우대금리 합계 계산
        const totalPreferentialRate = selectedRates.reduce((sum, rateId) => {
          const option = rateOptions.find((opt) => opt.id === rateId);
          return sum + (option ? option.rate : 0);
        }, 0);

        const finalRate = baseRate + totalPreferentialRate;

        let monthlyInterest = 0;
        let totalInterest = 0;
        let totalAmount = 0;

        if (productType === "적금") {
          // 적금: 매월 납입
          const monthlyPayment = amount / period;
          const monthlyRate = finalRate / 100 / 12;

          // 월복리 계산
          let totalAmountCalc = 0;
          for (let month = 1; month <= period; month++) {
            const remainingMonths = period - month + 1;
            totalAmountCalc +=
              monthlyPayment * Math.pow(1 + monthlyRate, remainingMonths);
          }

          const totalDeposit = monthlyPayment * period;
          totalInterest = totalAmountCalc - totalDeposit;
          totalAmount = totalAmountCalc;
          monthlyInterest = totalInterest / period; // 평균 월 이자
        } else {
          // 예금: 일시불
          const years = period / 12;
          const annualRate = finalRate / 100;

          totalAmount = amount * Math.pow(1 + annualRate, years);
          totalInterest = totalAmount - amount;
          monthlyInterest = totalInterest / period; // 평균 월 이자
        }

        return {
          amount,
          period,
          baseRate,
          preferentialRate: totalPreferentialRate,
          finalRate,
          monthlyInterest: Math.round(monthlyInterest),
          totalInterest: Math.round(totalInterest),
          totalAmount: Math.round(totalAmount),
        };
      };

      setSimulationData(generateSimulation());
    }
  }, [product, isOpen, selectedRates]);

  // 차트 데이터 생성
  useEffect(() => {
    if (product && isOpen && !propChartData.length) {
      const generateChartData = () => {
        const baseRate =
          parseFloat(product.interest_rate?.replace("%", "")) || 2.75;
        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        return months.map((month) => {
          const cumulativeInterest =
            ((1000000 *
              (baseRate +
                selectedRates.reduce((sum, rateId) => {
                  const option = rateOptions.find((opt) => opt.id === rateId);
                  return sum + (option ? option.rate : 0);
                }, 0))) /
              100 /
              12) *
            month;

          return {
            month: `${month}개월`,
            cumulativeInterest: Math.round(cumulativeInterest),
            totalAmount: 1000000 + Math.round(cumulativeInterest),
          };
        });
      };

      setChartData(generateChartData());
    }
  }, [product, isOpen, selectedRates]);

  // 복리/단리 비교 데이터 생성
  useEffect(() => {
    if (product && isOpen && !propCompoundComparisonData.length) {
      const generateCompoundComparison = () => {
        const baseRate =
          parseFloat(product.interest_rate?.replace("%", "")) || 2.75;
        const finalRate =
          baseRate +
          selectedRates.reduce((sum, rateId) => {
            const option = rateOptions.find((opt) => opt.id === rateId);
            return sum + (option ? option.rate : 0);
          }, 0);

        const principal = 1000000;
        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        // 카테고리별 신구 상품 매칭 (공식 사이트 크롤링 데이터 기반)
        const productCategories = {
          // 출산/육아 관련
          출산육아: {
            current: ["(아이) 꿈하나 적금", "하나 아이키움 적금"],
            previous: [
              { name: "하나 행복출산 적금", rate: 2.6, endDate: "2014.12.01" },
            ],
          },

          // 스포츠 관련
          스포츠: {
            current: ["(K리그) 우승 적금", "대전하나 축구사랑 적금"],
            previous: [
              { name: "하나 골프 적금", rate: 2.1, endDate: "2014.07.07" },
              {
                name: "오! 필승 코리아 적금 2012",
                rate: 2.3,
                endDate: "2014.02.11",
              },
            ],
          },

          // 여행/레저 관련
          여행레저: {
            current: ["도전365 적금"],
            previous: [
              { name: "하나 여행 적금", rate: 2.2, endDate: "2013.08.01" },
              {
                name: "2013년 순천만 국제정원 박람회 적금",
                rate: 2.1,
                endDate: "2013.11.21",
              },
            ],
          },

          // 자동차 관련
          자동차: {
            current: ["부자씨 적금"],
            previous: [
              { name: "기아차 마련 적금", rate: 2.4, endDate: "2015.01.01" },
            ],
          },

          // 게임/엔터테인먼트
          게임엔터: {
            current: ["달달 하나 적금"],
            previous: [
              { name: "애니팡 적금", rate: 2.1, endDate: "2016.02.01" },
            ],
          },

          // 주택/부동산
          주택부동산: {
            current: [
              "내집마련 더블업(Double-Up)적금",
              "청년 주택드림 청약통장",
              "주택청약종합저축",
            ],
            previous: [
              {
                name: "주택청약부금(구 하나은행)",
                rate: 2.2,
                endDate: "2015.09.01",
              },
            ],
          },

          // 일반 적금
          일반적금: {
            current: [
              "급여하나 월복리 적금",
              "하나 적금",
              "행복한 하나적금",
              "상호부금",
            ],
            previous: [
              { name: "KEB하나 재형저축", rate: 2.5, endDate: "2015.12.31" },
              {
                name: "난 할 수 있어 적금 2",
                rate: 2.3,
                endDate: "2015.12.31",
              },
              {
                name: "하나 적금(꿈나무플러스형, 기쁜날형)",
                rate: 2.2,
                endDate: "2013.08.01",
              },
            ],
          },

          // 특별/이벤트
          특별이벤트: {
            current: ["손님케어 적금", "행복나눔 적금"],
            previous: [
              {
                name: "하나 대한민국만세 적금",
                rate: 2.2,
                endDate: "2015.08.31",
              },
              { name: "하나 베레모적금", rate: 2.0, endDate: "2015.07.09" },
              {
                name: "하나 복지만두레 적금",
                rate: 2.3,
                endDate: "2014.04.01",
              },
            ],
          },

          // 예금 상품들
          예금: {
            current: [
              "하나의 정기예금",
              "정기예금",
              "고단위 플러스(금리연동형)",
              "고단위 플러스(금리확정형)",
            ],
            previous: [
              {
                name: "하나의 정기예금 (이전)",
                rate: 2.0,
                endDate: "2024.12.31",
              },
              { name: "정기예금 (이전)", rate: 1.8, endDate: "2024.12.31" },
              {
                name: "고단위 플러스 (이전)",
                rate: 2.2,
                endDate: "2024.12.31",
              },
            ],
          },
        };

        // 현재 상품명으로 카테고리 찾기
        const currentProductName =
          product.product_name || product.productName || "";

        // 카테고리별 매칭 로직
        let matchedCategory = null;
        let matchedPreviousProduct = null;

        // 각 카테고리에서 현재 상품이 포함되어 있는지 확인
        for (const [categoryName, categoryData] of Object.entries(
          productCategories
        )) {
          const isCurrentProduct = categoryData.current.some(
            (currentProduct) =>
              currentProductName.includes(currentProduct) ||
              currentProduct.includes(currentProductName)
          );

          if (isCurrentProduct && categoryData.previous.length > 0) {
            matchedCategory = categoryName;
            // 해당 카테고리의 첫 번째 이전 상품 선택 (또는 랜덤 선택)
            matchedPreviousProduct = categoryData.previous[0];
            break;
          }
        }

        // 매칭되지 않으면 상품 타입으로 기본 매칭
        if (!matchedPreviousProduct) {
          const productType =
            product.product_type || product.productType || "적금";
          if (productType === "예금") {
            matchedPreviousProduct = productCategories["예금"].previous[0];
          } else {
            matchedPreviousProduct = productCategories["일반적금"].previous[0];
          }
        }

        const previousRate = matchedPreviousProduct.rate;

        return months.map((month) => {
          // 하나은행 복리 (우대금리 적용)
          const hanaCompoundInterest =
            principal * Math.pow(1 + finalRate / 100 / 12, month) - principal;

          // 하나은행 단리
          const hanaSimpleInterest =
            ((principal * finalRate) / 100 / 12) * month;

          // 이전 상품 복리
          const previousCompoundInterest =
            principal * Math.pow(1 + previousRate / 100 / 12, month) -
            principal;

          // 이전 상품 단리
          const previousSimpleInterest =
            ((principal * previousRate) / 100 / 12) * month;

          return {
            month: `${month}개월`,
            hanaCompound: Math.round(hanaCompoundInterest),
            hanaSimple: Math.round(hanaSimpleInterest),
            previousCompound: Math.round(previousCompoundInterest),
            previousSimple: Math.round(previousSimpleInterest),
            hanaAdvantage: Math.round(
              hanaCompoundInterest - previousCompoundInterest
            ),
            compoundAdvantage: Math.round(
              hanaCompoundInterest - hanaSimpleInterest
            ),
            previousProductName: matchedPreviousProduct.name,
            previousProductRate: previousRate,
            previousProductEndDate: matchedPreviousProduct.endDate,
            matchedCategory: matchedCategory,
          };
        });
      };

      setCompoundComparisonData(generateCompoundComparison());
    }
  }, [product, isOpen, selectedRates]);

  // 우대금리 선택 핸들러
  const handleRateToggle = (rateId) => {
    if (isTablet) return; // 태블릿에서는 선택 불가

    setSelectedRates((prev) =>
      prev.includes(rateId)
        ? prev.filter((id) => id !== rateId)
        : [...prev, rateId]
    );
  };

  // 태블릿에 모달 데이터 전송
  useEffect(() => {
    if (isOpen && product && stompClient && sessionId && !isTablet) {
      const modalData = {
        type: "product-detail-modal",
        data: {
          product,
          simulationData,
          selectedRates,
          chartData,
          compoundComparisonData,
          rateOptions: rateOptionsState,
          timestamp: Date.now(),
        },
      };

      stompClient.publish({
        destination: `/topic/session/${sessionId}`,
        body: JSON.stringify(modalData),
      });

      console.log("📤 태블릿에 상품 상세 모달 데이터 전송:", modalData);
    }
  }, [
    isOpen,
    product,
    simulationData,
    selectedRates,
    chartData,
    compoundComparisonData,
    rateOptionsState,
    stompClient,
    sessionId,
    isTablet,
  ]);

  // 모달 닫기 핸들러
  const handleClose = () => {
    // 태블릿에 모달 닫기 알림 전송
    if (stompClient && sessionId && !isTablet) {
      const closeMessage = {
        type: "product-detail-modal-close",
        data: { timestamp: Date.now() },
      };

      stompClient.publish({
        destination: `/topic/session/${sessionId}`,
        body: JSON.stringify(closeMessage),
      });

      console.log("📤 태블릿에 모달 닫기 알림 전송:", closeMessage);
    }

    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>×</CloseButton>

        <Header>
          <ProductTitle>
            {product.product_name || product.productName}
          </ProductTitle>
          <ProductSubtitle>
            {product.product_type || product.productType} 상품
          </ProductSubtitle>
        </Header>

        <Content>
          {/* 우대금리 섹션 */}
          <Section>
            <SectionTitle>💰 우대금리 정보</SectionTitle>
            <FeatureGrid>
              <RateCard>
                <RateValue>{product.interest_rate || "2.75%"}</RateValue>
                <RateLabel>기본 금리</RateLabel>
              </RateCard>
              <RateCard>
                <RateValue>
                  {simulationData
                    ? `${simulationData.finalRate.toFixed(2)}%`
                    : "5.00%"}
                </RateValue>
                <RateLabel>적용 금리</RateLabel>
              </RateCard>
            </FeatureGrid>

            {/* 우대금리 선택 (행원 PC에서만) */}
            {!isTablet && hasRealBenefits && (
              <RateSelectionCard>
                <FeatureTitle>우대금리 선택</FeatureTitle>
                {rateOptionsState.map((option) => (
                  <CheckboxContainer
                    key={option.id}
                    selected={selectedRates.includes(option.id)}
                    onClick={() => handleRateToggle(option.id)}
                  >
                    <Checkbox
                      type="checkbox"
                      checked={selectedRates.includes(option.id)}
                      onChange={() => handleRateToggle(option.id)}
                    />
                    <CheckboxLabel>
                      {option.name}
                      <RateValueSpan> (+{option.rate}%p)</RateValueSpan>
                    </CheckboxLabel>
                  </CheckboxContainer>
                ))}
              </RateSelectionCard>
            )}

            {/* 우대금리 조건 표시 */}
            <FeatureCard>
              <FeatureTitle>우대금리 조건</FeatureTitle>
              <FeatureValue>
                {hasRealBenefits
                  ? rateOptionsState.length > 0
                    ? rateOptionsState
                        .map((option) => `${option.name} +${option.rate}%p`)
                        .join(", ")
                    : "해당 상품에는 우대금리가 없습니다."
                  : product.preferential_rate ||
                    "급여이체 우대 1.00% + 하나카드 결제 0.50% + 이벤트 특별금리 최고 3.50%"}
              </FeatureValue>
            </FeatureCard>
          </Section>

          {/* 상품 특징 섹션 */}
          <Section>
            <SectionTitle>⭐ 상품 특징</SectionTitle>
            <FeatureGrid>
              <FeatureCard>
                <FeatureTitle>상품 설명</FeatureTitle>
                <FeatureValue>
                  {product.product_features ||
                    "하나원큐 전용 상품으로 최대 연 5.00% 우대금리 제공"}
                </FeatureValue>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>가입 대상</FeatureTitle>
                <FeatureValue>
                  {product.target_customers ||
                    "만 14세 이상 실명의 개인 및 개인사업자 (1인 1계좌)"}
                </FeatureValue>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>예치 기간</FeatureTitle>
                <FeatureValue>{product.deposit_period || "1년"}</FeatureValue>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>예치 금액</FeatureTitle>
                <FeatureValue>
                  {product.deposit_amount || "매월 1만원 이상 ~ 30만원 이하"}
                </FeatureValue>
              </FeatureCard>
            </FeatureGrid>
          </Section>

          {/* 수익 시뮬레이션 섹션 */}
          {simulationData && (
            <Section>
              <SectionTitle>📊 수익 시뮬레이션</SectionTitle>
              <SimulationCard>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "18px", marginBottom: "10px" }}>
                    예치금액: {simulationData.amount.toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "18px", marginBottom: "10px" }}>
                    예치기간: {simulationData.period}개월
                  </div>
                  <div style={{ fontSize: "18px", marginBottom: "20px" }}>
                    적용금리: {simulationData.finalRate.toFixed(2)}%
                    {simulationData.preferentialRate > 0 && (
                      <span style={{ fontSize: "14px", opacity: 0.8 }}>
                        {" "}
                        (기본 {simulationData.baseRate}% + 우대{" "}
                        {simulationData.preferentialRate.toFixed(2)}%p)
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                      {simulationData.monthlyInterest.toLocaleString()}원
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      월 이자
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                      {simulationData.totalInterest.toLocaleString()}원
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      총 이자
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                      {simulationData.totalAmount.toLocaleString()}원
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      만기 수령액
                    </div>
                  </div>
                </div>
              </SimulationCard>

              {/* 수익 비교 차트 - 이자만 */}
              {compoundComparisonData.length > 0 && (
                <ChartContainer>
                  <FeatureTitle>
                    🏆{" "}
                    {compoundComparisonData[0]?.matchedCategory
                      ? `${compoundComparisonData[0]?.matchedCategory} 카테고리 비교`
                      : "신규 상품 vs 이전 상품 비교"}
                  </FeatureTitle>
                  <div
                    style={{
                      marginBottom: "15px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    💰 100만원 예치 시 12개월간 받는 이자 비교
                    <br />
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      비교 상품:{" "}
                      {compoundComparisonData[0]?.previousProductName} (
                      {compoundComparisonData[0]?.previousProductRate}%) - 판매
                      중지일:{" "}
                      {compoundComparisonData[0]?.previousProductEndDate}
                      {compoundComparisonData[0]?.matchedCategory && (
                        <span style={{ color: "#3b82f6", fontWeight: "bold" }}>
                          {" "}
                          • {compoundComparisonData[0]?.matchedCategory}{" "}
                          카테고리
                        </span>
                      )}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={compoundComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toLocaleString()}원`}
                        domain={[0, "dataMax + 5000"]}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value.toLocaleString()}원`,
                          name === "hanaCompound"
                            ? "신규 상품 복리"
                            : name === "previousCompound"
                            ? "이전 상품 복리"
                            : name,
                        ]}
                        labelFormatter={(label) => `기간: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="previousCompound"
                        stroke="#e5e7eb"
                        strokeWidth={2}
                        dot={{ fill: "#e5e7eb", strokeWidth: 2, r: 3 }}
                        name="이전 상품"
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="hanaCompound"
                        stroke="#1e3a8a"
                        strokeWidth={4}
                        dot={{ fill: "#1e3a8a", strokeWidth: 2, r: 5 }}
                        name="신규 상품"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* 하나은행 우위 요약 */}
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background:
                        "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      🎯 신규 상품 선택 시 추가 수익
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                        marginBottom: "5px",
                      }}
                    >
                      +
                      {compoundComparisonData[
                        compoundComparisonData.length - 1
                      ]?.hanaAdvantage.toLocaleString()}
                      원
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        opacity: 0.9,
                      }}
                    >
                      12개월 후 이전 상품 대비 추가 수익
                    </div>
                  </div>
                </ChartContainer>
              )}

              {/* 복리 효과 차트 */}
              {compoundComparisonData.length > 0 && (
                <ChartContainer>
                  <FeatureTitle>📈 복리의 힘 - 하나은행 내부 비교</FeatureTitle>
                  <div
                    style={{
                      marginBottom: "15px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    💡 같은 금리라도 복리로 받으면 더 많은 수익!
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={compoundComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toLocaleString()}원`}
                        domain={[0, "dataMax + 2000"]}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value.toLocaleString()}원`,
                          name === "hanaSimple"
                            ? "하나은행 단리"
                            : name === "hanaCompound"
                            ? "하나은행 복리"
                            : name,
                        ]}
                        labelFormatter={(label) => `기간: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="hanaSimple"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        name="단리"
                      />
                      <Line
                        type="monotone"
                        dataKey="hanaCompound"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        name="복리"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* 복리 추가 수익 요약 */}
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      ⚡ 복리 선택 시 추가 수익
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                        marginBottom: "5px",
                      }}
                    >
                      +
                      {compoundComparisonData[
                        compoundComparisonData.length - 1
                      ]?.compoundAdvantage.toLocaleString()}
                      원
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        opacity: 0.9,
                      }}
                    >
                      단리 대비 추가 수익 (12개월)
                    </div>
                  </div>
                </ChartContainer>
              )}
            </Section>
          )}

          {/* 가입조건 확인 섹션 */}
          <Section>
            <SectionTitle>📋 가입조건 확인</SectionTitle>
            <FeatureGrid>
              <FeatureCard>
                <FeatureTitle>가입 자격</FeatureTitle>
                <ConditionList>
                  <ConditionItem>
                    {product.eligibility_requirements ||
                      "만 14세 이상 실명의 개인 및 개인사업자"}
                  </ConditionItem>
                  <ConditionItem>1인 1계좌 제한</ConditionItem>
                  <ConditionItem>신분증 및 서류 필요</ConditionItem>
                </ConditionList>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>해지 조건</FeatureTitle>
                <ConditionList>
                  <ConditionItem>
                    {product.withdrawal_conditions ||
                      "만기일 이전 2회까지 일부해지 가능"}
                  </ConditionItem>
                  <ConditionItem>해지 시 우대금리 적용 안됨</ConditionItem>
                  <ConditionItem>해지 수수료 없음</ConditionItem>
                </ConditionList>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>세제 혜택</FeatureTitle>
                <ConditionList>
                  <ConditionItem>
                    {product.tax_benefits || "비과세종합저축 가능"}
                  </ConditionItem>
                  <ConditionItem>연간 200만원 한도</ConditionItem>
                  <ConditionItem>종합소득세 신고 필요</ConditionItem>
                </ConditionList>
              </FeatureCard>
              <FeatureCard>
                <FeatureTitle>특이사항</FeatureTitle>
                <ConditionList>
                  <ConditionItem>
                    {product.notes || "2025.12.31까지 3만좌 한정 판매"}
                  </ConditionItem>
                  <ConditionItem>온라인 가입 가능</ConditionItem>
                  <ConditionItem>자동이체 설정 권장</ConditionItem>
                </ConditionList>
              </FeatureCard>
            </FeatureGrid>
          </Section>
        </Content>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ProductDetailModal;
