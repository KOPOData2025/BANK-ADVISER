import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

const RecommendationContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: var(--hana-space-5);
  margin-bottom: var(--hana-space-3);
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

const FilterTabs = styled.div`
  display: flex;
  gap: var(--hana-space-2);
  margin-bottom: var(--hana-space-4);
  border-bottom: 1px solid var(--hana-border-light);
`;

const FilterTab = styled.button`
  padding: var(--hana-space-2) var(--hana-space-4);
  border: none;
  background: ${(props) => (props.active ? "#008485" : "transparent")};
  color: ${(props) => (props.active ? "white" : "#666")};
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;

  &:hover {
    background: ${(props) => (props.active ? "#006666" : "#F5F5F5")};
    color: ${(props) => (props.active ? "white" : "#008485")};
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--hana-space-4);
`;

const ProductCard = styled.div`
  background: ${(props) => props.background || "rgba(255, 255, 255, 0.9)"};
  border-radius: 15px;
  padding: var(--hana-space-4);
  border: 2px solid
    ${(props) => props.borderColor || "rgba(102, 126, 234, 0.2)"};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    border-color: ${(props) => props.borderColor || "rgba(102, 126, 234, 0.4)"};
  }
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--hana-space-3);
`;

const ProductTitle = styled.h4`
  margin: 0;
  color: var(--hana-primary);
  font-size: var(--hana-font-size-lg);
  font-weight: 600;
  line-height: 1.3;
`;

const ProductBadge = styled.div`
  background: ${(props) => props.background || "var(--hana-primary)"};
  color: white;
  padding: var(--hana-space-1) var(--hana-space-2);
  border-radius: var(--hana-radius-full);
  font-size: var(--hana-font-size-xs);
  font-weight: 600;
  white-space: nowrap;
`;

const ProductStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hana-space-3);
  margin-bottom: var(--hana-space-3);
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: var(--hana-font-size-lg);
  font-weight: bold;
  color: ${(props) => props.color || "var(--hana-primary)"};
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-gray);
`;

const ProductDescription = styled.p`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-dark-gray);
  line-height: 1.4;
  margin: 0 0 var(--hana-space-3) 0;
`;

const RecommendationReason = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--hana-radius-sm);
  padding: var(--hana-space-2);
  margin-top: var(--hana-space-2);
`;

const ReasonTitle = styled.div`
  font-size: var(--hana-font-size-xs);
  font-weight: 600;
  color: var(--hana-primary);
  margin-bottom: var(--hana-space-1);
`;

const ReasonText = styled.div`
  font-size: var(--hana-font-size-xs);
  color: var(--hana-dark-gray);
  line-height: 1.3;
`;

// 고객 맞춤 상품 추천 로직
const generateRecommendations = (customer, currentProducts) => {
  console.log("generateRecommendations - customer:", customer);
  console.log("generateRecommendations - currentProducts:", currentProducts);

  if (!customer) {
    console.log("generateRecommendations - no customer, returning empty array");
    return [];
  }

  const recommendations = [];
  // 연령 보강: 생년월일로 계산 시도
  let age = customer.Age || customer.age;
  if (
    !age &&
    (customer.DateOfBirth || customer.dateofbirth || customer.dateOfBirth)
  ) {
    try {
      const dobStr =
        customer.DateOfBirth || customer.dateofbirth || customer.dateOfBirth;
      const dob = new Date(dobStr);
      const now = new Date();
      age =
        now.getFullYear() -
        dob.getFullYear() -
        (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
          ? 1
          : 0);
    } catch (_) {
      age = 30;
    }
  }
  if (!age) age = 30;
  const totalAssets = currentProducts.reduce(
    (sum, p) => sum + (p.balance || 0),
    0
  );

  console.log(
    "generateRecommendations - age:",
    age,
    "totalAssets:",
    totalAssets
  );
  const hasDeposit = currentProducts.some(
    (p) => p.productType?.includes("예금") || p.productType?.includes("적금")
  );
  const hasLoan = currentProducts.some((p) => p.productType?.includes("대출"));
  const hasInvestment = currentProducts.some(
    (p) => p.productType?.includes("펀드") || p.productType?.includes("주식")
  );

  // 1. 고금리 정기예금 (모든 고객)
  if (!hasDeposit || totalAssets < 10000000) {
    recommendations.push({
      id: "high-rate-deposit",
      title: "하나금융그룹 우대금리 정기예금",
      type: "deposit",
      category: "예금",
      icon: "💰",
      interestRate: 4.2,
      minAmount: 1000000,
      period: "12개월",
      background: "linear-gradient(135deg, #E5F3FF, #F0F8FF)",
      borderColor: "var(--hana-primary)",
      badge: "HOT",
      badgeColor: "var(--hana-red)",
      description:
        "우대금리 적용으로 높은 수익률을 제공하는 정기예금 상품입니다.",
      reason:
        "현재 보유 예금 상품이 부족하여 안정적인 수익을 위한 정기예금을 추천합니다.",
      features: [
        "우대금리 0.5%p 추가",
        "온라인 가입 시 추가 우대",
        "자동재예치 가능",
      ],
    });
  }

  // 2. 주택청약종합저축 (30-40대)
  if (
    age >= 30 &&
    age <= 40 &&
    !currentProducts.some((p) => p.productName?.includes("주택청약"))
  ) {
    recommendations.push({
      id: "housing-savings",
      title: "하나주택청약종합저축",
      type: "savings",
      category: "적금",
      icon: "🏠",
      interestRate: 3.8,
      minAmount: 50000,
      period: "최대 10년",
      background: "linear-gradient(135deg, #E5FFF5, #F0FFFA)",
      borderColor: "var(--hana-mint)",
      badge: "추천",
      badgeColor: "var(--hana-mint)",
      description:
        "주택 구입을 위한 특별한 저축 상품으로 우대 혜택을 제공합니다.",
      reason: "고객님의 연령대에 맞는 주택 구입 준비를 위한 상품입니다.",
      features: ["주택청약 자격 부여", "우대금리 적용", "세제 혜택"],
    });
  }

  // 3. 연금저축 (40대 이상)
  if (
    age >= 40 &&
    !currentProducts.some((p) => p.productType?.includes("연금"))
  ) {
    recommendations.push({
      id: "pension-savings",
      title: "하나연금저축",
      type: "pension",
      category: "연금",
      icon: "👴",
      interestRate: 3.5,
      minAmount: 100000,
      period: "최대 20년",
      background: "linear-gradient(135deg, #FFF5E5, #FFFBF0)",
      borderColor: "var(--hana-orange)",
      badge: "필수",
      badgeColor: "var(--hana-orange)",
      description: "안정적인 노후 준비를 위한 연금저축 상품입니다.",
      reason: "노후 준비를 위한 연금 상품이 필요합니다.",
      features: ["세제 혜택", "안정적 수익", "장기 저축"],
    });
  }

  // 4. 적금 상품 (저축 습관 형성)
  if (!currentProducts.some((p) => p.productType?.includes("적금"))) {
    recommendations.push({
      id: "regular-savings",
      title: "하나우리적금",
      type: "savings",
      category: "적금",
      icon: "🐷",
      interestRate: 3.2,
      minAmount: 10000,
      period: "12개월",
      background: "linear-gradient(135deg, #F5E5FF, #FAF0FF)",
      borderColor: "var(--hana-purple)",
      badge: "인기",
      badgeColor: "var(--hana-purple)",
      description: "꾸준한 저축 습관을 만들어주는 정기적금 상품입니다.",
      reason: "정기적인 저축 습관 형성을 위해 적금 상품을 추천합니다.",
      features: ["낮은 가입금액", "우대금리", "자동이체 혜택"],
    });
  }

  // 5. 대출 상품 (자금 필요시)
  if (totalAssets > 50000000 && !hasLoan) {
    recommendations.push({
      id: "home-equity-loan",
      title: "하나주택담보대출",
      type: "loan",
      category: "대출",
      icon: "🏦",
      interestRate: 3.9,
      minAmount: 10000000,
      period: "최대 30년",
      background: "linear-gradient(135deg, #FFE5E5, #FFF0F0)",
      borderColor: "var(--hana-red)",
      badge: "우대",
      badgeColor: "var(--hana-red)",
      description: "주택 담보를 활용한 저금리 대출 상품입니다.",
      reason: "보유 자산을 활용한 투자 기회를 제공합니다.",
      features: ["저금리", "장기 대출", "우대 조건"],
    });
  }

  // 6. 투자 상품 (고수익 추구)
  if (age < 50 && totalAssets > 20000000 && !hasInvestment) {
    recommendations.push({
      id: "equity-fund",
      title: "하나글로벌주식형펀드",
      type: "investment",
      category: "투자",
      icon: "📈",
      interestRate: 7.5,
      minAmount: 100000,
      period: "장기투자",
      background: "linear-gradient(135deg, #E5FFE5, #F0FFF0)",
      borderColor: "var(--hana-success)",
      badge: "고수익",
      badgeColor: "var(--hana-success)",
      description: "글로벌 주식에 투자하는 고수익 펀드 상품입니다.",
      reason: "고객님의 연령과 자산 규모에 맞는 투자 상품입니다.",
      features: ["글로벌 분산투자", "전문가 운용", "고수익 기대"],
    });
  }

  // 최소 3개는 보장되도록 기본 상품을 채움
  if (recommendations.length < 3) {
    console.log("generateRecommendations - ensuring minimum recommendations");

    // 기본 예금 상품
    if (!recommendations.some((r) => r.id === "default-deposit"))
      recommendations.push({
        id: "default-deposit",
        title: "하나우리예금",
        type: "deposit",
        category: "예금",
        icon: "💰",
        interestRate: 3.2,
        minAmount: 1000000,
        period: "12개월",
        background: "linear-gradient(135deg, #E5F3FF, #F0F8FF)",
        borderColor: "var(--hana-primary)",
        badge: "인기",
        badgeColor: "var(--hana-primary)",
        description: "안정적인 수익을 원하는 고객을 위한 예금 상품입니다.",
        reason: "안정적인 자산 운용을 위한 기본 예금 상품입니다.",
        features: ["안정적 수익", "우대금리", "자동재예치"],
      });

    // 기본 적금 상품
    if (!recommendations.some((r) => r.id === "default-savings"))
      recommendations.push({
        id: "default-savings",
        title: "하나우리적금",
        type: "savings",
        category: "적금",
        icon: "🐷",
        interestRate: 3.5,
        minAmount: 10000,
        period: "12개월",
        background: "linear-gradient(135deg, #F5E5FF, #FAF0FF)",
        borderColor: "var(--hana-purple)",
        badge: "추천",
        badgeColor: "var(--hana-purple)",
        description: "꾸준한 저축 습관을 만들어주는 정기적금 상품입니다.",
        reason: "정기적인 저축 습관 형성을 위해 적금 상품을 추천합니다.",
        features: ["낮은 가입금액", "우대금리", "자동이체 혜택"],
      });

    // 세 번째 보장: 연령대에 맞춘 주택청약/연금 중 하나
    if (recommendations.length < 3) {
      if (
        age >= 20 &&
        age <= 49 &&
        !recommendations.some((r) => r.id === "housing-savings")
      ) {
        recommendations.push({
          id: "housing-savings",
          title: "하나주택청약종합저축",
          type: "savings",
          category: "적금",
          icon: "🏠",
          interestRate: 3.8,
          minAmount: 50000,
          period: "최대 10년",
          background: "linear-gradient(135deg, #E5FFF5, #F0FFFA)",
          borderColor: "var(--hana-mint)",
          badge: "추천",
          badgeColor: "var(--hana-mint)",
          description: "주택 구입을 위한 특별한 저축 상품으로 우대 혜택 제공",
          reason: "연령대와 목적에 맞춘 주택 준비 상품",
          features: ["청약 자격", "우대금리", "세제 혜택"],
        });
      } else if (!recommendations.some((r) => r.id === "pension-savings")) {
        recommendations.push({
          id: "pension-savings",
          title: "하나연금저축",
          type: "pension",
          category: "연금",
          icon: "👴",
          interestRate: 3.5,
          minAmount: 100000,
          period: "최대 20년",
          background: "linear-gradient(135deg, #FFF5E5, #FFFBF0)",
          borderColor: "var(--hana-orange)",
          badge: "필수",
          badgeColor: "var(--hana-orange)",
          description: "안정적인 노후 준비를 위한 연금저축 상품",
          reason: "연령대에 맞춘 노후 준비 상품",
          features: ["세제 혜택", "안정적 수익"],
        });
      }
    }
  }

  console.log(
    "generateRecommendations - final recommendations:",
    recommendations
  );
  return recommendations;
};

const ProductRecommendationEnhanced = ({
  customer,
  customerProducts = [],
  onSelectProduct,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // 고객 맞춤 상품 추천 로직을 useMemo로 최적화
  const recommendations = useMemo(() => {
    if (!customer) {
      console.log(
        "ProductRecommendationEnhanced - no customer, returning empty array"
      );
      return [];
    }

    console.log(
      "ProductRecommendationEnhanced - generating recommendations for:",
      customer
    );
    return generateRecommendations(customer, customerProducts);
  }, [customer, customerProducts]);

  // 디버깅을 위한 콘솔 로그
  console.log("ProductRecommendationEnhanced - customer:", customer);
  console.log(
    "ProductRecommendationEnhanced - customerProducts:",
    customerProducts
  );
  console.log(
    "ProductRecommendationEnhanced - recommendations:",
    recommendations
  );

  const filteredRecommendations =
    activeFilter === "all"
      ? recommendations
      : recommendations.filter((rec) => rec.type === activeFilter);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "예금":
        return "💰";
      case "적금":
        return "🐷";
      case "연금":
        return "👴";
      case "대출":
        return "🏦";
      case "투자":
        return "📈";
      default:
        return "💼";
    }
  };

  // 로딩 상태 처리
  useEffect(() => {
    if (customer) {
      setIsLoading(true);
      // 짧은 지연 후 로딩 완료 (UI 안정성을 위해)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [customer]);

  if (isLoading) {
    return (
      <RecommendationContainer>
        <SectionTitle>🎯 맞춤 상품 추천</SectionTitle>
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--hana-gray)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
          <p>맞춤 상품을 분석하고 있습니다...</p>
        </div>
      </RecommendationContainer>
    );
  }

  return (
    <RecommendationContainer>
      <SectionTitle>🎯 맞춤 상품 추천</SectionTitle>

      <FilterTabs>
        <FilterTab
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        >
          전체 ({recommendations.length})
        </FilterTab>
        <FilterTab
          active={activeFilter === "deposit"}
          onClick={() => setActiveFilter("deposit")}
        >
          예금 ({recommendations.filter((r) => r.type === "deposit").length})
        </FilterTab>
        <FilterTab
          active={activeFilter === "savings"}
          onClick={() => setActiveFilter("savings")}
        >
          적금 ({recommendations.filter((r) => r.type === "savings").length})
        </FilterTab>
        <FilterTab
          active={activeFilter === "loan"}
          onClick={() => setActiveFilter("loan")}
        >
          대출 ({recommendations.filter((r) => r.type === "loan").length})
        </FilterTab>
        <FilterTab
          active={activeFilter === "investment"}
          onClick={() => setActiveFilter("investment")}
        >
          투자 ({recommendations.filter((r) => r.type === "investment").length})
        </FilterTab>
      </FilterTabs>

      <ProductGrid>
        {filteredRecommendations.map((product) => (
          <ProductCard
            key={product.id}
            background={product.background}
            borderColor={product.borderColor}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("상품 클릭됨:", product);
              console.log("onSelectProduct 콜백:", onSelectProduct);
              if (onSelectProduct) {
                onSelectProduct(product);
                console.log("상품 전송 완료");
              } else {
                console.error("onSelectProduct 콜백이 없습니다!");
              }
            }}
          >
            <ProductHeader>
              <ProductTitle>{product.title}</ProductTitle>
              <ProductBadge background={product.badgeColor}>
                {product.badge}
              </ProductBadge>
            </ProductHeader>

            <ProductDescription>{product.description}</ProductDescription>

            <ProductStats>
              <StatItem>
                <StatValue color={product.borderColor}>
                  {product.interestRate}%
                </StatValue>
                <StatLabel>연이율</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue color="var(--hana-gray)">
                  {product.minAmount.toLocaleString()}원
                </StatValue>
                <StatLabel>최소금액</StatLabel>
              </StatItem>
            </ProductStats>

            <RecommendationReason>
              <ReasonTitle>💡 추천 이유</ReasonTitle>
              <ReasonText>{product.reason}</ReasonText>
            </RecommendationReason>

            <div
              style={{
                marginTop: "var(--hana-space-3)",
                fontSize: "12px",
                color: "var(--hana-gray)",
              }}
            >
              <strong>주요 특징:</strong> {product.features.join(" • ")}
            </div>
          </ProductCard>
        ))}
      </ProductGrid>

      {filteredRecommendations.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--hana-space-8)",
            color: "var(--hana-gray)",
          }}
        >
          <div
            style={{ fontSize: "2rem", marginBottom: "var(--hana-space-2)" }}
          >
            🎉
          </div>
          <p>현재 추천할 상품이 없습니다.</p>
          <p style={{ fontSize: "14px", marginTop: "var(--hana-space-2)" }}>
            고객님의 포트폴리오가 이미 잘 구성되어 있습니다!
          </p>
        </div>
      )}
    </RecommendationContainer>
  );
};

export default ProductRecommendationEnhanced;
