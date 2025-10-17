import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import {
  getProductInterestRates,
  getBestRateForPeriod,
} from "../../utils/interestRateUtils";
import { getApiUrl } from "../../config/api";
import { getConditionSuggestions } from "../../data/conditionMapping";
import ProductComparisonChart from "../common/ProductComparisonChart";
import ProductAnalysisModal from "../common/ProductAnalysisModal";

const SimulationContainer = styled.div`
  padding: 2rem;
  height: 100%;
  overflow: auto;
`;

const SimulationHeader = styled.div`
  background: linear-gradient(
    135deg,
    var(--hana-mint) 0%,
    var(--hana-mint-dark) 100%
  );
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 4rem;
    opacity: 0.3;
  }
`;

const SimulationTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const SimulationSubtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
`;

const IntelligentCommandBar = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
`;

const CommandBarTitle = styled.h3`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CommandInput = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3),
      0 6px 16px rgba(0, 0, 0, 0.15);
  }

  &::placeholder {
    color: #6c757d;
  }
`;

const SuggestedConditions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SuggestedCondition = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

// 활성화된 요소 표시 바
const ActiveBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const ActiveChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 132, 133, 0.12);
  color: var(--hana-black);
  border: 1px solid var(--hana-mint);
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
`;

const ChipRemove = styled.button`
  all: unset;
  cursor: pointer;
  color: var(--hana-mint);
`;

const SimulationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ProductRankingPanel = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const ProductRankingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${(props) =>
    props.isSelected ? "rgba(0, 132, 133, 0.15)" : "var(--hana-gray)"};
  border: ${(props) =>
    props.isSelected ? "2px solid var(--hana-mint)" : "1px solid transparent"};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${(props) =>
      props.isSelected ? "rgba(0, 132, 133, 0.2)" : "rgba(0, 132, 133, 0.08)"};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.2);
    border-color: var(--hana-mint);
  }

  &:active {
    transform: translateY(0px);
    box-shadow: 0 2px 6px rgba(0, 132, 133, 0.3);
  }
`;

const ProductRankingInfo = styled.div`
  flex: 1;
`;

const ProductRankingName = styled.div`
  font-weight: 600;
  color: var(--hana-black);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
`;

const ProductRankingType = styled.div`
  font-size: 0.8rem;
  color: var(--hana-dark-gray);
  margin-bottom: 0.25rem;
`;

const ProductRankingRates = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const ProductRankingBaseRate = styled.span`
  color: var(--hana-dark-gray);
`;

const ProductRankingPreferentialRate = styled.span`
  color: var(--hana-mint);
  font-weight: 600;
`;

const ProductRankingFinalRate = styled.span`
  color: var(--hana-orange);
  font-weight: 700;
`;

const ProductRankingPosition = styled.div`
  background: ${(props) => {
    if (props.position === 1)
      return "linear-gradient(135deg, #FFD700, #FFA500)";
    if (props.position === 2)
      return "linear-gradient(135deg, #C0C0C0, #A0A0A0)";
    if (props.position === 3)
      return "linear-gradient(135deg, #CD7F32, #B8860B)";
    return "var(--hana-mint)";
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

const ProductSelector = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ConditionsPanel = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  color: var(--hana-mint);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProductSelect = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: var(--hana-mint);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1.5rem 4rem 1.5rem 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 16px;
  font-size: 1.2rem;
  background: #f8f9fa;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  min-height: 60px;

  &:focus {
    outline: none;
    border-color: var(--hana-mint);
    background: white;
    box-shadow: 0 0 0 4px rgba(0, 132, 133, 0.15),
      0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &::placeholder {
    color: #6c757d;
    font-weight: 400;
    font-size: 1.1rem;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 1.5rem;
  pointer-events: none;
  z-index: 1;
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

const ShowMoreButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: var(--hana-mint);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
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
  padding: 1rem;
  background: ${(props) =>
    props.isSelected
      ? "linear-gradient(135deg, rgba(0, 132, 133, 0.15), rgba(0, 132, 133, 0.05))"
      : "linear-gradient(135deg, #f8f9fa, #e9ecef)"};
  border: ${(props) =>
    props.isSelected ? "2px solid var(--hana-mint)" : "1px solid #dee2e6"};
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.isSelected
      ? "0 4px 12px rgba(0, 132, 133, 0.2)"
      : "0 2px 4px rgba(0, 0, 0, 0.05)"};

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(0, 132, 133, 0.08),
      rgba(0, 132, 133, 0.02)
    );
    border-color: var(--hana-mint);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 132, 133, 0.15);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(0, 132, 133, 0.15),
      rgba(0, 132, 133, 0.05)
    );
    border-color: var(--hana-mint);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.2);
  }
`;

const ConditionRate = styled.div`
  background: var(--hana-mint);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const ConditionInfo = styled.div`
  flex: 1;
`;

const ConditionName = styled.div`
  font-weight: 600;
  color: var(--hana-black);
  margin-bottom: 0.25rem;
`;

const ConditionDescription = styled.div`
  font-size: 0.9rem;
  color: var(--hana-dark-gray);
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  ${ToggleInput}:checked + & {
    background-color: var(--hana-mint);
  }

  ${ToggleInput}:checked + &:before {
    transform: translateX(26px);
  }
`;

const ResultsPanel = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResultCard = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    var(--hana-mint-light) 0%,
    var(--hana-mint) 100%
  );
  color: white;
  border-radius: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("/api/placeholder/pattern") repeat;
    opacity: 0.1;
  }
`;

const ResultLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
`;

const ResultValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
`;

const BenefitsList = styled.div`
  margin-top: 1.5rem;
`;

const BenefitItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--hana-gray);
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const BenefitName = styled.div`
  font-weight: 500;
  color: var(--hana-black);
`;

const BenefitValue = styled.div`
  font-weight: 600;
  color: var(--hana-mint);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: var(--hana-mint);
    color: white;

    &:hover {
      background: var(--hana-mint-dark);
      transform: translateY(-2px);
    }
  }

  &.secondary {
    background: var(--hana-white);
    color: var(--hana-mint);
    border: 2px solid var(--hana-mint);

    &:hover {
      background: var(--hana-mint);
      color: white;
    }
  }
`;

// 중복된 IntelligentCommandBar 제거됨 - 새로운 스타일 사용

const CommandButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--hana-mint);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: var(--hana-mint-dark);
  }
`;

const SimulationPanel = ({
  customer,
  onScreenSync,
  sessionId,
  stompClient,
}) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rankedProducts, setRankedProducts] = useState([]);
  const [selectedProductsForAnalysis, setSelectedProductsForAnalysis] =
    useState([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // 검색 및 페이징 상태
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [conditionSearchTerm, setConditionSearchTerm] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllConditions, setShowAllConditions] = useState(false);
  const [displayedProductCount, setDisplayedProductCount] = useState(5);
  const [displayedConditionCount, setDisplayedConditionCount] = useState(5);

  // 지능형 커맨드 바 상태
  const [commandInput, setCommandInput] = useState("");
  const [suggestedConditions, setSuggestedConditions] = useState([]);

  const formatRate = (rate) => {
    return rate ? rate.toFixed(2) + "%" : "0.00%";
  };

  // 매핑 테이블은 별도 파일로 분리됨 (conditionMapping.js)

  // 텍스트 분석 및 조건 추천
  const analyzeTextAndSuggestConditions = (text) => {
    console.log("🧠 지능형 분석 시작:", {
      text,
      conditionsCount: conditions.length,
    });

    if (!text || text.length < 2) {
      setSuggestedConditions([]);
      return;
    }

    // 새로운 헬퍼 함수 사용
    const matchedConditions = getConditionSuggestions(text, conditions);

    console.log("✅ 최종 매칭된 조건:", matchedConditions);
    setSuggestedConditions(matchedConditions);
  };

  // 커맨드 입력 처리
  const handleCommandInput = (e) => {
    const value = e.target.value;
    setCommandInput(value);
    analyzeTextAndSuggestConditions(value);
  };

  // 추천 조건 클릭 처리
  const handleSuggestedConditionClick = (conditionName) => {
    console.log("🔍 추천 조건 클릭:", conditionName);
    console.log("📋 전체 조건 목록:", conditions);

    const matchingCondition = conditions.find((condition) => {
      // 정확한 매칭
      const exactNameMatch = condition.ConditionName === conditionName;
      const exactDescMatch = condition.Description === conditionName;

      // 부분 매칭 (대소문자 구분 없음)
      const nameMatch =
        condition.ConditionName &&
        condition.ConditionName.toLowerCase().includes(
          conditionName.toLowerCase()
        );
      const descMatch =
        condition.Description &&
        condition.Description.toLowerCase().includes(
          conditionName.toLowerCase()
        );

      const isMatch =
        exactNameMatch || exactDescMatch || nameMatch || descMatch;

      console.log(
        `조건 "${condition.ConditionName}": exactName=${exactNameMatch}, exactDesc=${exactDescMatch}, nameMatch=${nameMatch}, descMatch=${descMatch}, isMatch=${isMatch}`
      );
      return isMatch;
    });

    console.log("✅ 매칭된 조건:", matchingCondition);

    if (matchingCondition) {
      const isSelected = selectedConditions.includes(
        matchingCondition.ConditionID
      );
      console.log("이미 선택됨:", isSelected);

      if (!isSelected) {
        console.log("조건 추가:", matchingCondition);
        setSelectedConditions([
          ...selectedConditions,
          matchingCondition.ConditionID,
        ]);

        // 성공 메시지 표시 (선택사항)
        console.log(
          "✅ 조건이 성공적으로 추가되었습니다:",
          matchingCondition.ConditionName
        );
      } else {
        console.log("이미 선택된 조건입니다.");
      }
    } else {
      console.log("❌ 매칭되는 조건을 찾을 수 없습니다.");
    }

    // 입력창 초기화
    setCommandInput("");
    setSuggestedConditions([]);
  };

  // 엔터키 처리
  const handleCommandKeyPress = (e) => {
    if (e.key === "Enter" && suggestedConditions.length > 0) {
      handleSuggestedConditionClick(suggestedConditions[0]);
    }
  };

  // 시뮬레이션 태블릿 동기화 제거됨 - 비교분석만 사용

  // 변경사항을 실시간으로 태블릿에 브로드캐스트 (디바운스)
  useEffect(() => {
    if (!sessionId) return;
    const timer = setTimeout(() => {
      const payload = {
        selectedProduct,
        simulationResult,
        selectedConditions,
        customer: customer,
        rankedProducts,
        conditions,
      };
      // syncSimulationToTablet 제거됨
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedProduct, selectedConditions, rankedProducts, simulationResult]);

  // 시뮬레이션 태블릿 알림 제거됨

  // 필터링된 상품 목록
  const filteredProducts = rankedProducts.filter(
    (product) =>
      product.productName
        .toLowerCase()
        .includes(productSearchTerm.toLowerCase()) ||
      product.productType
        .toLowerCase()
        .includes(productSearchTerm.toLowerCase())
  );

  // 필터링된 조건 목록
  const filteredConditions = conditions.filter(
    (condition) =>
      condition.ConditionName.toLowerCase().includes(
        conditionSearchTerm.toLowerCase()
      ) ||
      condition.Description.toLowerCase().includes(
        conditionSearchTerm.toLowerCase()
      )
  );

  // 디버깅 로그
  console.log("🔍 검색 디버깅:", {
    productSearchTerm,
    conditionSearchTerm,
    rankedProductsCount: rankedProducts.length,
    conditionsCount: conditions.length,
    filteredProductsCount: filteredProducts.length,
    filteredConditionsCount: filteredConditions.length,
    rankedProducts: rankedProducts.slice(0, 3), // 처음 3개 상품만 로그
    conditions: conditions.slice(0, 3), // 처음 3개 조건만 로그
  });

  // 표시할 상품 목록 (페이징 적용) - 선택된 상품을 상단으로 정렬
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aSelected =
      selectedProduct?.id === a.id ||
      selectedProduct?.ProductID === a.ProductID;
    const bSelected =
      selectedProduct?.id === b.id ||
      selectedProduct?.ProductID === b.ProductID;

    if (aSelected && !bSelected) return -1; // a가 선택됨, b가 선택 안됨 -> a가 위로
    if (!aSelected && bSelected) return 1; // a가 선택 안됨, b가 선택됨 -> b가 위로
    return 0; // 둘 다 같으면 원래 순서 유지
  });

  const displayedProducts = showAllProducts
    ? sortedProducts
    : sortedProducts.slice(0, displayedProductCount);

  // 표시할 조건 목록 (페이징 적용) - 활성화된 조건을 상단으로 정렬
  const sortedConditions = [...filteredConditions].sort((a, b) => {
    const aSelected = selectedConditions.includes(a.ConditionID);
    const bSelected = selectedConditions.includes(b.ConditionID);

    if (aSelected && !bSelected) return -1; // a가 선택됨, b가 선택 안됨 -> a가 위로
    if (!aSelected && bSelected) return 1; // a가 선택 안됨, b가 선택됨 -> b가 위로
    return 0; // 둘 다 같으면 원래 순서 유지
  });

  const displayedConditions = showAllConditions
    ? sortedConditions
    : sortedConditions.slice(0, displayedConditionCount);

  useEffect(() => {
    console.log("🚀 SimulationPanel 컴포넌트 마운트됨");
    fetchProducts();
    fetchConditions();
  }, []);

  // 조건 데이터 로딩 상태 디버깅
  useEffect(() => {
    console.log("📊 조건 데이터 상태 변경:", {
      conditionsCount: conditions.length,
      conditions: conditions.slice(0, 3), // 처음 3개만 로그
    });
  }, [conditions]);

  // 상품이 로드된 후 조건 추출
  useEffect(() => {
    if (products.length > 0 && conditions.length === 0) {
      extractConditionsFromProducts();
    }
  }, [products]);

  // 상품 순위 계산 및 업데이트
  useEffect(() => {
    if (products.length > 0) {
      calculateProductRankings();
    }
  }, [products, selectedConditions, conditions]);

  // 상품 순위 계산 함수
  const calculateProductRankings = () => {
    const ranked = products
      .map((product) => {
        // 기본 금리 계산
        let baseRate = 2.0; // 기본값
        if (product.basic_rates) {
          // JSONB 타입 처리
          let basicRatesData = product.basic_rates;
          if (typeof basicRatesData === "object" && basicRatesData.value) {
            try {
              basicRatesData = JSON.parse(basicRatesData.value);
            } catch (e) {
              console.warn("basic_rates 파싱 실패:", e);
            }
          }

          if (basicRatesData && basicRatesData.description) {
            const rateMatch = basicRatesData.description.match(/(\d+\.?\d*)/);
            if (rateMatch) {
              baseRate = parseFloat(rateMatch[1]);
            }
          }
        }

        // 선택된 조건들에 대해 실제 상품의 우대금리 적용
        let totalPreferentialRate = 0;
        const applicableConditions = [];

        // preferential_rates JSONB 파싱
        let preferentialRates = [];
        if (product.preferential_rates) {
          try {
            if (
              typeof product.preferential_rates === "object" &&
              product.preferential_rates.value
            ) {
              preferentialRates = JSON.parse(product.preferential_rates.value);
            } else if (Array.isArray(product.preferential_rates)) {
              preferentialRates = product.preferential_rates;
            }
          } catch (e) {
            console.warn("preferential_rates 파싱 실패:", e);
          }
        }

        if (preferentialRates && Array.isArray(preferentialRates)) {
          selectedConditions.forEach((conditionId) => {
            const condition = conditions.find(
              (c) => c.ConditionID === conditionId
            );
            if (condition) {
              // 해당 상품에 이 조건이 있는지 확인
              const matchingRate = preferentialRates.find(
                (rate) => rate.item === condition.ConditionName
              );

              if (matchingRate) {
                totalPreferentialRate += matchingRate.rate_value || 0;
                applicableConditions.push({
                  ...condition,
                  actualRate: matchingRate.rate_value,
                  actualRateDisplay: matchingRate.rate,
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
      .sort((a, b) => b.finalRate - a.finalRate); // 우대금리 높은 순으로 정렬

    setRankedProducts(ranked);
  };

  const fetchProducts = async () => {
    try {
      // 실제 product_details 테이블에서 데이터 가져오기
      const response = await axios.get(
        getApiUrl("/api/employee/products/details")
      );
      const productsData = response.data.data || response.data;
      setProducts(productsData);
      console.log("실제 데이터베이스에서 가져온 상품 데이터:", productsData);
    } catch (error) {
      console.error("상품 조회 오류:", error);
      // 백업으로 기존 API 사용
      try {
        const backupResponse = await axios.get(
          getApiUrl("/api/employee/products/all")
        );
        const backupData = backupResponse.data.data || backupResponse.data;
        setProducts(backupData);
      } catch (backupError) {
        console.error("백업 상품 조회도 실패:", backupError);
      }
    }
  };

  const fetchConditions = async () => {
    try {
      console.log("🔍 우대금리 조건 조회 시작...");
      // 실제 product_details 테이블에서 모든 우대금리 조건 추출
      const response = await axios.get(
        getApiUrl("/api/employee/products/preferential-conditions")
      );
      console.log("📡 API 응답:", response.data);

      const conditionsData = response.data.data || response.data;
      console.log("📊 조건 데이터:", conditionsData);

      // 데이터베이스에서 가져온 조건을 프론트엔드 형식으로 변환
      const formattedConditions = conditionsData.map((condition, index) => ({
        ConditionID: index + 1,
        ConditionName: condition.condition_name,
        Description: condition.description,
        PreferentialRate: condition.rate_value || 0,
        RateDisplay: condition.rate_display,
      }));

      console.log("✅ 변환된 조건:", formattedConditions);
      setConditions(formattedConditions);
      console.log(
        "실제 데이터베이스에서 가져온 우대금리 조건:",
        formattedConditions.length,
        "개"
      );
    } catch (error) {
      console.error("❌ 우대금리 조건 조회 오류:", error);
      // 백업: 상품 데이터에서 우대금리 조건 추출
      if (products.length > 0) {
        console.log("🔄 백업: 상품 데이터에서 조건 추출 시도...");
        extractConditionsFromProducts();
      }
    }
  };

  // 상품 데이터에서 우대금리 조건 추출하는 함수
  const extractConditionsFromProducts = () => {
    const allConditions = new Map();

    products.forEach((product) => {
      if (
        product.preferential_rates &&
        Array.isArray(product.preferential_rates)
      ) {
        product.preferential_rates.forEach((rate) => {
          const key = rate.item;
          if (!allConditions.has(key)) {
            allConditions.set(key, {
              ConditionID: allConditions.size + 1,
              ConditionName: rate.item,
              Description: rate.description,
              PreferentialRate: rate.rate_value || 0,
              RateDisplay: rate.rate,
            });
          }
        });
      }
    });

    const conditionsArray = Array.from(allConditions.values());
    setConditions(conditionsArray);
    console.log("추출된 우대금리 조건:", conditionsArray);
  };

  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value);
    const product = products.find((p) => p.ProductID === productId);
    setSelectedProduct(product);
    setSimulationResult(null);
  };

  const handleConditionToggle = (conditionId) => {
    setSelectedConditions((prev) => {
      const newConditions = prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId];

      // 조건이 변경되면 자동으로 시뮬레이션 실행
      if (selectedProduct) {
        runSimulation(selectedProduct.ProductID, newConditions);
      }

      return newConditions;
    });
  };

  // 실제 금리 계산 함수
  const calculateActualInterestRate = (productName, periodMonths = 12) => {
    const rateInfo = getBestRateForPeriod(productName, periodMonths);
    return rateInfo ? rateInfo.interestRate : null;
  };

  // 시뮬레이션 결과에 실제 금리 반영
  const enhanceSimulationWithActualRates = (
    result,
    productName,
    periodMonths
  ) => {
    const actualRate = calculateActualInterestRate(productName, periodMonths);

    // 백엔드 응답 구조에 맞게 필드명 매핑
    const enhancedResult = {
      baseInterestRate: result.baseInterestRate || result.baseRate || 2.5,
      preferentialRate: result.preferentialRate || 0,
      totalInterestRate: result.totalInterestRate || result.totalRate || 2.5,
      estimatedReturn:
        result.expectedReturn || result.estimatedReturn || 1000000,
      monthlyPayment: result.monthlyPayment || 100000,
      maturityAmount: result.maturityAmount || 1350000,
      benefits: result.benefits || [],
      actualRateUsed: actualRate ? true : false,
      rateSource: actualRate ? "실시간 시장금리" : "기본 금리",
    };

    if (actualRate) {
      enhancedResult.baseInterestRate = actualRate;
      enhancedResult.actualRateUsed = true;
      enhancedResult.rateSource = "실시간 시장금리";
    }

    return enhancedResult;
  };

  const runSimulation = async (productId, conditionIds) => {
    if (!productId) return;

    setLoading(true);

    try {
      const response = await axios.post(getApiUrl("/api/simulation/benefits"), {
        customerId: customer.CustomerID,
        productId: productId,
        selectedConditions: conditionIds,
      });

      // 백엔드 응답 구조에 맞게 수정
      const simulationData = response.data.data || response.data;

      // 실제 금리로 강화된 시뮬레이션 결과
      const productName =
        selectedProduct?.ProductName || selectedProduct?.product_name;
      const enhancedResult = enhanceSimulationWithActualRates(
        simulationData,
        productName,
        12 // 기본 12개월
      );

      setSimulationResult(enhancedResult);

      // 고객 화면에 시뮬레이션 결과 동기화
      onScreenSync({
        type: "simulation-result",
        data: {
          product: selectedProduct,
          result: enhancedResult,
        },
      });
    } catch (error) {
      console.error("시뮬레이션 오류:", error);

      // API 오류 시 프론트엔드에서 기본 시뮬레이션 제공
      if (selectedProduct) {
        const productName =
          selectedProduct.ProductName || selectedProduct.product_name;
        const actualRate = calculateActualInterestRate(productName);

        const fallbackResult = {
          baseInterestRate: actualRate || 2.5,
          preferentialRate: selectedConditions.length * 0.1,
          totalInterestRate:
            (actualRate || 2.5) + selectedConditions.length * 0.1,
          estimatedReturn: 1000000, // 임시 값
          actualRateUsed: actualRate ? true : false,
          rateSource: actualRate ? "실시간 시장금리" : "기본 금리",
          fallbackMode: true,
        };

        setSimulationResult(fallbackResult);
      }
    } finally {
      setLoading(false);
    }
  };

  // 기존 handleIntelligentCommand 함수는 새로운 실시간 텍스트 분석 로직으로 대체됨

  const handleApplyToCustomer = () => {
    if (simulationResult && selectedProduct) {
      // 태블릿에 시뮬레이션 완료 알림
      // simulation-complete 메시지 전송 제거됨

      // 시뮬레이션 태블릿 동기화 제거됨

      onScreenSync({
        type: "show-application-form",
        data: {
          product: selectedProduct,
          simulation: simulationResult,
          sessionId: sessionId,
        },
      });
    }
  };

  // 완료 버튼 제거됨: 실시간 동기화로 대체

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
              {customer.Name}님의 조건에 맞는 최적의 금융 혜택을
              시뮬레이션해보세요
            </SimulationSubtitle>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* 분석 버튼 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  color:
                    selectedProductsForAnalysis.length > 0
                      ? "var(--hana-mint)"
                      : "#999",
                  fontWeight: "600",
                }}
              >
                {selectedProductsForAnalysis.length > 0
                  ? `${selectedProductsForAnalysis.length}개 선택됨`
                  : "상품 선택"}
              </div>
              <button
                onClick={() => {
                  setShowAnalysisModal(true);
                  console.log(
                    "🔍 비교분석 모달 열기 - 선택된 상품:",
                    selectedProductsForAnalysis
                  );
                  // 태블릿에 비교분석 열림 동기화
                  onScreenSync &&
                    onScreenSync({
                      type: "show-analysis",
                      data: {
                        products: selectedProductsForAnalysis,
                        customer,
                        conditions: selectedConditions,
                      },
                    });
                }}
                disabled={selectedProductsForAnalysis.length === 0}
                style={{
                  background:
                    selectedProductsForAnalysis.length > 0
                      ? "linear-gradient(135deg, var(--hana-mint) 0%, var(--hana-mint-dark) 100%)"
                      : "#F5F5F5",
                  color:
                    selectedProductsForAnalysis.length > 0 ? "white" : "#CCC",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  cursor:
                    selectedProductsForAnalysis.length > 0
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.3s ease",
                  boxShadow:
                    selectedProductsForAnalysis.length > 0
                      ? "0 2px 8px rgba(0, 132, 133, 0.3)"
                      : "none",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  if (selectedProductsForAnalysis.length > 0) {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(0, 132, 133, 0.4)";
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    selectedProductsForAnalysis.length > 0
                      ? "0 2px 8px rgba(0, 132, 133, 0.3)"
                      : "none";
                }}
              >
                비교분석
              </button>
            </div>
          </div>
        </div>
      </SimulationHeader>

      <IntelligentCommandBar>
        <CommandBarTitle>🧠 지능형 우대금리 분석</CommandBarTitle>
        <CommandInput
          type="text"
          placeholder="고객 정보를 입력하세요 (예: 30대 공무원, 서울 거주, 급여이체)"
          value={commandInput}
          onChange={handleCommandInput}
          onKeyPress={handleCommandKeyPress}
        />
        {suggestedConditions.length > 0 && (
          <SuggestedConditions>
            {suggestedConditions.map((condition, index) => (
              <SuggestedCondition
                key={index}
                onClick={() => handleSuggestedConditionClick(condition)}
              >
                {condition}
              </SuggestedCondition>
            ))}
          </SuggestedConditions>
        )}

        {/* 활성화된 조건만 표시 (상품 제외) */}
        {selectedConditions.length > 0 && (
          <ActiveBar>
            {selectedConditions.map((cid) => {
              const c = conditions.find((x) => x.ConditionID === cid);
              if (!c) return null;
              return (
                <ActiveChip key={`active-${cid}`}>
                  우대: {c.ConditionName}
                  <ChipRemove
                    aria-label="remove-condition"
                    onClick={() => handleConditionToggle(cid)}
                  >
                    ✕
                  </ChipRemove>
                </ActiveChip>
              );
            })}
          </ActiveBar>
        )}
      </IntelligentCommandBar>

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
            조건을 선택하면 실시간으로 순위가 변경됩니다
            <br />
            <span style={{ color: "var(--hana-mint)", fontWeight: "600" }}>
              팁: 오른쪽 체크박스를 클릭하여 분석할 상품을 선택하세요 (최대 3개)
            </span>
          </div>

          <SearchContainer>
            <SearchIcon>🔍</SearchIcon>
            <SearchInput
              type="text"
              placeholder="  상품명 또는 상품유형으로 검색..."
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <ScrollableContainer>
            {displayedProducts.map((product, index) => (
              <ProductRankingItem
                key={product.id || product.ProductID}
                isSelected={
                  selectedProduct?.id === product.id ||
                  selectedProduct?.ProductID === product.ProductID
                }
                onClick={() => {
                  setSelectedProduct(product);
                  // 상품 선택 시 자동으로 시뮬레이션 실행
                  if (selectedConditions.length > 0) {
                    runSimulation(
                      product.ProductID || product.id,
                      selectedConditions
                    );
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <ProductRankingPosition position={index + 1}>
                    {index + 1}
                  </ProductRankingPosition>
                  <ProductRankingInfo>
                    <ProductRankingName>
                      {product.productName}
                    </ProductRankingName>
                    <ProductRankingType>
                      {product.productType}
                    </ProductRankingType>
                    <ProductRankingRates>
                      <ProductRankingBaseRate>
                        기본: {product.baseRate.toFixed(2)}%
                      </ProductRankingBaseRate>
                      {product.totalPreferentialRate > 0 && (
                        <ProductRankingPreferentialRate>
                          우대: +{product.totalPreferentialRate.toFixed(2)}%
                        </ProductRankingPreferentialRate>
                      )}
                      <ProductRankingFinalRate>
                        최종: {product.finalRate.toFixed(2)}%
                      </ProductRankingFinalRate>
                    </ProductRankingRates>
                  </ProductRankingInfo>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    key={`checkbox-${product.id || product.ProductID || index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      border: "2px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: selectedProductsForAnalysis.some((p) => {
                        const currentId = product.id || product.ProductID;
                        const selectedId = p.id || p.ProductID;
                        return currentId === selectedId;
                      })
                        ? "var(--hana-mint)"
                        : "white",
                      transition: "all 0.2s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // 상품 선택 이벤트 방지
                      const currentId = product.id || product.ProductID;
                      const isAlreadySelected =
                        selectedProductsForAnalysis.some((p) => {
                          const selectedId = p.id || p.ProductID;
                          return currentId === selectedId;
                        });

                      if (isAlreadySelected) {
                        setSelectedProductsForAnalysis((prev) =>
                          prev.filter((p) => {
                            const selectedId = p.id || p.ProductID;
                            return currentId !== selectedId;
                          })
                        );
                      } else if (selectedProductsForAnalysis.length < 3) {
                        setSelectedProductsForAnalysis((prev) => [
                          ...prev,
                          product,
                        ]);
                      }
                    }}
                  >
                    {selectedProductsForAnalysis.some((p) => {
                      const currentId = product.id || product.ProductID;
                      const selectedId = p.id || p.ProductID;
                      return currentId === selectedId;
                    }) && (
                      <span
                        style={{
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </ProductRankingItem>
            ))}
          </ScrollableContainer>

          {filteredProducts.length > displayedProductCount &&
            !showAllProducts && (
              <ShowMoreButton onClick={() => setShowAllProducts(true)}>
                더보기
              </ShowMoreButton>
            )}

          {showAllProducts && (
            <ShowMoreButton onClick={() => setShowAllProducts(false)}>
              접기
            </ShowMoreButton>
          )}
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
            조건을 선택하면 상품 순위가 실시간으로 변경됩니다
          </div>

          <SearchContainer>
            <SearchIcon>🔍</SearchIcon>
            <SearchInput
              type="text"
              placeholder="  조건명 또는 설명으로 검색..."
              value={conditionSearchTerm}
              onChange={(e) => setConditionSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <ScrollableContainer>
            <ConditionsList>
              {displayedConditions.map((condition) => (
                <ConditionItem
                  key={condition.ConditionID}
                  isSelected={selectedConditions.includes(
                    condition.ConditionID
                  )}
                  className={
                    selectedConditions.includes(condition.ConditionID)
                      ? "active"
                      : ""
                  }
                >
                  <ConditionInfo>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <ConditionName>{condition.ConditionName}</ConditionName>
                      <ConditionRate>
                        +{condition.PreferentialRate.toFixed(2)}%
                      </ConditionRate>
                    </div>
                    <ConditionDescription>
                      {condition.Description}
                    </ConditionDescription>
                  </ConditionInfo>
                  <ToggleSwitch>
                    <ToggleInput
                      type="checkbox"
                      checked={selectedConditions.includes(
                        condition.ConditionID
                      )}
                      onChange={() =>
                        handleConditionToggle(condition.ConditionID)
                      }
                    />
                    <ToggleSlider />
                  </ToggleSwitch>
                </ConditionItem>
              ))}
            </ConditionsList>
          </ScrollableContainer>

          {filteredConditions.length > displayedConditionCount &&
            !showAllConditions && (
              <ShowMoreButton onClick={() => setShowAllConditions(true)}>
                더보기
              </ShowMoreButton>
            )}

          {showAllConditions && (
            <ShowMoreButton onClick={() => setShowAllConditions(false)}>
              접기
            </ShowMoreButton>
          )}
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
            (Array.isArray(simulationResult.benefits)
              ? simulationResult.benefits.length > 0
              : Object.keys(simulationResult.benefits).length > 0) && (
              <div>
                <h4 style={{ color: "var(--hana-mint)", marginBottom: "1rem" }}>
                  적용된 혜택
                </h4>
                <BenefitsList>
                  {Array.isArray(simulationResult.benefits)
                    ? simulationResult.benefits.map((benefit, index) => (
                        <BenefitItem key={index}>
                          <BenefitName>
                            {benefit.BenefitName || benefit.name}
                          </BenefitName>
                          <BenefitValue>
                            {benefit.BenefitType === "Interest Rate" &&
                              `+${benefit.ApplicableValue}%`}
                            {benefit.BenefitType === "Fee Discount" &&
                              "수수료 면제"}
                            {benefit.BenefitType === "Points" &&
                              `${benefit.ApplicableValue}P`}
                            {benefit.BenefitType === "Cashback" &&
                              `${benefit.ApplicableValue}% 캐시백`}
                            {!benefit.BenefitType && benefit.value}
                          </BenefitValue>
                        </BenefitItem>
                      ))
                    : Object.entries(simulationResult.benefits).map(
                        ([key, value], index) => (
                          <BenefitItem key={index}>
                            <BenefitName>{key}</BenefitName>
                            <BenefitValue>{value}</BenefitValue>
                          </BenefitItem>
                        )
                      )}
                </BenefitsList>
              </div>
            )}

          <ActionButtons>
            <ActionButton
              className="secondary"
              onClick={() => {
                // 시뮬레이션 태블릿 동기화 제거됨

                onScreenSync({
                  type: "show-detailed-simulation",
                  data: simulationResult,
                });
              }}
            >
              상세 분석 보기
            </ActionButton>
            {/* 실시간 동기화로 전환되어 완료 버튼 제거 */}
            <ActionButton className="primary" onClick={handleApplyToCustomer}>
              고객에게 제안하기
            </ActionButton>
          </ActionButtons>
        </ResultsPanel>
      )}

      {/* 상품 분석 모달 */}
      <ProductAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false);
          // 태블릿에 비교분석 닫힘 동기화
          onScreenSync && onScreenSync({ type: "hide-analysis" });
        }}
        selectedProducts={selectedProductsForAnalysis}
        customerProduct={selectedProduct}
        simulationAmount={1000000}
        simulationPeriod={12}
        stompClient={stompClient}
        sessionId={sessionId}
      />

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="spinner"></div>
          <p>시뮬레이션 실행 중...</p>
        </div>
      )}
    </SimulationContainer>
  );
};

export default SimulationPanel;
