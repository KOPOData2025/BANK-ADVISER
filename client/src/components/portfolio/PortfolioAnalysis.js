import React from "react";
import styled from "styled-components";

const AnalysisContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: var(--hana-space-5);
  margin-bottom: 0;
  box-shadow: 0 4px 20px rgba(0, 132, 133, 0.08);
  border: 2px solid #008485;
  min-height: 600px;
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  color: #008485;
  margin-bottom: var(--hana-space-4);
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);
  line-height: 1.3;
  letter-spacing: "-0.3px";

  &::before {
    content: "";
    width: 4px;
    height: 24px;
    background: #008485;
    border-radius: 2px;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--hana-space-2);
  margin-bottom: var(--hana-space-3);
`;

const MetricCard = styled.div`
  background: ${(props) => props.background || "white"};
  padding: var(--hana-space-3);
  border-radius: 8px;
  text-align: center;
  border: 1px solid ${(props) => props.borderColor || "#E5E5E5"};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.1);
    border-color: #008485;
  }
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${(props) => props.color || "var(--hana-primary)"};
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: var(--hana-gray);
  margin-bottom: 8px;
`;

const MetricDescription = styled.div`
  font-size: 12px;
  color: var(--hana-dark-gray);
  line-height: 1.4;
`;

const RiskLevel = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);
  margin-bottom: var(--hana-space-4);
`;

const RiskIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.level) {
      case "low":
        return "var(--hana-success)";
      case "medium":
        return "var(--hana-orange)";
      case "high":
        return "var(--hana-red)";
      default:
        return "var(--hana-gray)";
    }
  }};
`;

const PortfolioChart = styled.div`
  background: var(--hana-bg-gray);
  border-radius: var(--hana-radius-md);
  padding: var(--hana-space-4);
  margin-top: var(--hana-space-4);
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--hana-space-3);
  margin-top: var(--hana-space-3);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-1);
  font-size: 12px;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${(props) => props.color};
`;

const PortfolioAnalysis = ({ customerProducts = [], totalAssets = 0 }) => {
  // 포트폴리오 분석 로직
  const analyzePortfolio = (products) => {
    const analysis = {
      totalProducts: products.length,
      totalAssets: totalAssets,
      depositRatio: 0,
      loanRatio: 0,
      investmentRatio: 0,
      averageInterestRate: 0,
      riskLevel: "low",
      diversificationScore: 0,
      liquidityScore: 0,
      profitabilityScore: 0,
    };

    if (products.length === 0) return analysis;

    // 상품 유형별 분석
    const depositProducts = products.filter(
      (p) =>
        p.productType?.includes("예금") ||
        p.productType?.includes("적금") ||
        p.productType?.includes("입출금")
    );
    const loanProducts = products.filter(
      (p) => p.productType?.includes("대출") || p.productType?.includes("신용")
    );
    const investmentProducts = products.filter(
      (p) =>
        p.productType?.includes("펀드") ||
        p.productType?.includes("주식") ||
        p.productType?.includes("채권")
    );

    const depositAssets = depositProducts.reduce(
      (sum, p) => sum + (p.balance || 0),
      0
    );
    const loanAssets = loanProducts.reduce(
      (sum, p) => sum + (p.balance || 0),
      0
    );
    const investmentAssets = investmentProducts.reduce(
      (sum, p) => sum + (p.balance || 0),
      0
    );

    // 총자산: prop이 0이면 제품 합계로 계산
    const computedTotalAssets =
      totalAssets && totalAssets > 0
        ? totalAssets
        : products.reduce((sum, p) => sum + (p.balance || 0), 0);
    analysis.totalAssets = computedTotalAssets;

    analysis.depositRatio =
      computedTotalAssets > 0 ? (depositAssets / computedTotalAssets) * 100 : 0;
    analysis.loanRatio =
      computedTotalAssets > 0 ? (loanAssets / computedTotalAssets) * 100 : 0;
    analysis.investmentRatio =
      computedTotalAssets > 0
        ? (investmentAssets / computedTotalAssets) * 100
        : 0;

    // 평균 금리 계산: 잔액 가중 평균
    const interestWeighted = products.reduce(
      (acc, p) => {
        const bal = p.balance || 0;
        const rate = p.interestRate || p.rate || 0;
        return { w: acc.w + bal * rate, b: acc.b + bal };
      },
      { w: 0, b: 0 }
    );
    analysis.averageInterestRate =
      interestWeighted.b > 0 ? interestWeighted.w / interestWeighted.b : 0;

    // 리스크 레벨 계산
    if (analysis.investmentRatio > 50) {
      analysis.riskLevel = "high";
    } else if (analysis.investmentRatio > 20 || analysis.loanRatio > 30) {
      analysis.riskLevel = "medium";
    } else {
      analysis.riskLevel = "low";
    }

    // 다양화 점수 (0-100)
    const productTypes = new Set(products.map((p) => p.productType)).size;
    analysis.diversificationScore = Math.min((productTypes / 5) * 100, 100);

    // 유동성 점수 (예금/적금 비율 기반, 대출 과다시 감점)
    const liquidityBase = Math.min(analysis.depositRatio, 100);
    analysis.liquidityScore = Math.max(
      0,
      liquidityBase - Math.max(0, analysis.loanRatio - 20)
    );

    // 수익성 점수 (평균 금리 기반)
    analysis.profitabilityScore = Math.min(
      analysis.averageInterestRate * 10,
      100
    );

    return analysis;
  };

  const analysis = analyzePortfolio(customerProducts);

  const getRiskLevelText = (level) => {
    switch (level) {
      case "low":
        return "안정형";
      case "medium":
        return "균형형";
      case "high":
        return "적극형";
      default:
        return "미분류";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--hana-success)";
    if (score >= 60) return "var(--hana-orange)";
    return "var(--hana-red)";
  };

  return (
    <AnalysisContainer>
      <SectionTitle>📊 포트폴리오 분석</SectionTitle>

      <MetricsGrid>
        <MetricCard borderColor="var(--hana-primary)">
          <MetricValue color="var(--hana-primary)">
            {analysis.totalProducts}개
          </MetricValue>
          <MetricLabel>보유 상품 수</MetricLabel>
          <MetricDescription>다양한 상품으로 포트폴리오 구성</MetricDescription>
        </MetricCard>

        <MetricCard borderColor="var(--hana-mint)">
          <MetricValue color="var(--hana-mint)">
            {analysis.averageInterestRate.toFixed(2)}%
          </MetricValue>
          <MetricLabel>평균 금리</MetricLabel>
          <MetricDescription>전체 포트폴리오의 평균 수익률</MetricDescription>
        </MetricCard>

        <MetricCard borderColor="var(--hana-orange)">
          <RiskLevel>
            <RiskIndicator level={analysis.riskLevel} />
            <MetricValue color="var(--hana-orange)">
              {getRiskLevelText(analysis.riskLevel)}
            </MetricValue>
          </RiskLevel>
          <MetricLabel>리스크 레벨</MetricLabel>
          <MetricDescription>투자 성향 및 위험도 분석</MetricDescription>
        </MetricCard>

        <MetricCard borderColor="var(--hana-success)">
          <MetricValue color={getScoreColor(analysis.diversificationScore)}>
            {analysis.diversificationScore.toFixed(0)}점
          </MetricValue>
          <MetricLabel>다양화 점수</MetricLabel>
          <MetricDescription>포트폴리오 분산 투자 정도</MetricDescription>
        </MetricCard>

        <MetricCard borderColor="var(--hana-blue)">
          <MetricValue color={getScoreColor(analysis.liquidityScore)}>
            {analysis.liquidityScore.toFixed(0)}점
          </MetricValue>
          <MetricLabel>유동성 점수</MetricLabel>
          <MetricDescription>자금 유동성 확보 정도</MetricDescription>
        </MetricCard>

        <MetricCard borderColor="var(--hana-purple)">
          <MetricValue color={getScoreColor(analysis.profitabilityScore)}>
            {analysis.profitabilityScore.toFixed(0)}점
          </MetricValue>
          <MetricLabel>수익성 점수</MetricLabel>
          <MetricDescription>포트폴리오 수익성 평가</MetricDescription>
        </MetricCard>
      </MetricsGrid>

      <PortfolioChart>
        <h4
          style={{
            margin: "0 0 var(--hana-space-3) 0",
            color: "var(--hana-primary)",
          }}
        >
          📈 자산 구성 비율
        </h4>
        <div
          style={{
            display: "flex",
            height: "20px",
            borderRadius: "var(--hana-radius-sm)",
            overflow: "hidden",
            marginBottom: "var(--hana-space-2)",
          }}
        >
          <div
            style={{
              width: `${analysis.depositRatio}%`,
              background:
                "linear-gradient(90deg, var(--hana-primary), var(--hana-mint))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {analysis.depositRatio > 10 &&
              `${analysis.depositRatio.toFixed(0)}%`}
          </div>
          <div
            style={{
              width: `${analysis.loanRatio}%`,
              background:
                "linear-gradient(90deg, var(--hana-orange), var(--hana-red))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {analysis.loanRatio > 10 && `${analysis.loanRatio.toFixed(0)}%`}
          </div>
          <div
            style={{
              width: `${analysis.investmentRatio}%`,
              background:
                "linear-gradient(90deg, var(--hana-purple), var(--hana-blue))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {analysis.investmentRatio > 10 &&
              `${analysis.investmentRatio.toFixed(0)}%`}
          </div>
        </div>

        <ChartLegend>
          <LegendItem>
            <LegendColor color="var(--hana-primary)" />
            <span>예금/적금 ({analysis.depositRatio.toFixed(1)}%)</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="var(--hana-orange)" />
            <span>대출 ({analysis.loanRatio.toFixed(1)}%)</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="var(--hana-purple)" />
            <span>투자상품 ({analysis.investmentRatio.toFixed(1)}%)</span>
          </LegendItem>
        </ChartLegend>
      </PortfolioChart>
    </AnalysisContainer>
  );
};

export default PortfolioAnalysis;
