import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getProductInterestRates,
  getBestRateForPeriod,
} from "../../utils/interestRateUtils";
import {
  productCategories,
  productDetails,
  productIcons,
  productColors,
} from "../../data/hanaProducts";
import ProductAnalysisModal from "../common/ProductAnalysisModal";
import ProductDetailModal from "../common/ProductDetailModal";
import { createClient } from "@supabase/supabase-js";
import { saveFormWithScreenshot } from "../../utils/screenshotUtils";
import html2canvas from "html2canvas";

// Supabase 클라이언트 초기화
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://jhfjigeuxrxxbbsoflcd.supabase.co";
const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// 공통 상품 ID 매핑 함수
const getProductIdMapping = () => {
  return {
    "3·6·9 정기예금": "P033", // 펫사랑 적금
    "(내맘) 적금": "P084_내맘_적금",
    "급여하나 월복리 적금": "P004", // 급여하나 월복리 적금
    "달달 하나 적금": "P001_급여하나월복리적금",
    "대전하나 축구사랑 적금": "P048", // 대전하나 축구사랑 적금
    "도전365 적금": "P089_도전_365_적금",
    "부자씨 적금": "P046", // 부자씨 적금
    "손님케어 적금": "P031", // 손님케어적금
    "하나 아이키움 적금": "P047", // 하나 아이키움 적금
    "하나 중소기업재직자 우대저축": "P078_하나_중소기업재직자_우대저축",
    "내집마련 더블업(Double-Up)적금": "P093_내집마련더블업적금",
    "청년 주택드림 청약통장": "P051", // 청년 주택드림 청약통장 (공백 포함)
    청년주택드림청약통장: "P051", // 청년주택드림청약통장 (공백 없음)
    "하나 청년도약계좌": "P049", // 하나 청년도약계좌
    "하나 청년도약플러스 적금": "P057", // 하나 청년도약플러스 적금
  };
};

const ExplorerContainer = styled.div`
  padding: var(--hana-space-8);
  height: 100%;
  overflow: auto;
  background: var(--hana-bg-gray);
  font-family: var(--hana-font-family);
`;

const SearchBar = styled.div`
  display: flex;
  gap: var(--hana-space-4);
  margin-bottom: var(--hana-space-8);
  align-items: center;
  background: var(--hana-white);
  padding: var(--hana-space-6);
  border-radius: var(--hana-radius-lg);
  box-shadow: var(--hana-shadow-light);
  border: var(--hana-border-light);
`;

const SearchInput = styled.input`
  flex: 1;
  padding: var(--hana-space-4);
  border: 2px solid var(--hana-light-gray);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-base);
  font-family: var(--hana-font-family);
  transition: all var(--hana-transition-base);

  &:focus {
    outline: none;
    border-color: var(--hana-primary);
    box-shadow: 0 0 0 3px rgba(0, 133, 122, 0.1);
  }

  &::placeholder {
    color: var(--hana-gray);
    font-weight: 500;
  }
`;

const FilterSelect = styled.select`
  padding: var(--hana-space-4);
  border: 2px solid var(--hana-light-gray);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-base);
  font-family: var(--hana-font-family);
  background: var(--hana-white);
  min-width: 200px;
  font-weight: 600;
  color: var(--hana-primary);
  transition: all var(--hana-transition-base);

  &:focus {
    outline: none;
    border-color: var(--hana-primary);
    box-shadow: 0 0 0 3px rgba(0, 133, 122, 0.1);
  }
`;

// 리스트 형식 헤더
const ListHeader = styled.div`
  background: var(--hana-white);
  border-radius: var(--hana-radius-lg);
  box-shadow: var(--hana-shadow-light);
  border: var(--hana-border-light);
  margin-bottom: var(--hana-space-6);
  overflow: hidden;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--hana-space-4) var(--hana-space-6);
  border-bottom: 1px solid var(--hana-light-gray);
`;

const ComparisonSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-3);
`;

const CompareButton = styled.button`
  background: var(--hana-primary);
  color: var(--hana-white);
  border: none;
  padding: var(--hana-space-2) var(--hana-space-4);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--hana-transition-base);

  &:hover {
    background: var(--hana-primary-dark);
    transform: translateY(-1px);
  }
`;

const CompareText = styled.span`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-gray);
  font-weight: 500;
`;

const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--hana-space-4) var(--hana-space-6);
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-4);
`;

const MainTitle = styled.h2`
  font-size: var(--hana-font-size-xl);
  font-weight: 700;
  color: var(--hana-text-primary);
  margin: 0;
`;

const DateInfo = styled.span`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-gray);
  font-weight: 500;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: var(--hana-space-2);
`;

const FilterTab = styled.button`
  padding: var(--hana-space-2) var(--hana-space-4);
  border: 1px solid var(--hana-light-gray);
  background: ${(props) =>
    props.active ? "var(--hana-primary)" : "var(--hana-white)"};
  color: ${(props) =>
    props.active ? "var(--hana-white)" : "var(--hana-text-primary)"};
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--hana-transition-base);

  &:hover {
    border-color: var(--hana-primary);
    background: ${(props) =>
      props.active ? "var(--hana-primary-dark)" : "var(--hana-primary-light)"};
  }
`;

// 상품 리스트 컨테이너
const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--hana-space-3);
  margin-bottom: var(--hana-space-8);
`;

// 상품 리스트 아이템
const ProductListItem = styled.div`
  background: var(--hana-white);
  border-radius: var(--hana-radius-lg);
  box-shadow: var(--hana-shadow-light);
  border: var(--hana-border-light);
  transition: all var(--hana-transition-base);
  overflow: hidden;

  &:hover {
    box-shadow: var(--hana-shadow-medium);
    border-color: var(--hana-primary);
  }
`;

const ProductItemContent = styled.div`
  display: flex;
  align-items: center;
  padding: var(--hana-space-4) var(--hana-space-6);
  gap: var(--hana-space-4);
`;

const ProductLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-4);
  flex: 1;
`;

const ProductCheckbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductTags = styled.div`
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);
  margin-bottom: var(--hana-space-2);
`;

const ProductTag = styled.span`
  padding: 2px 8px;
  border-radius: var(--hana-radius-sm);
  font-size: var(--hana-font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.primary {
    background: var(--hana-primary);
    color: var(--hana-white);
  }

  &.secondary {
    background: var(--hana-primary-light);
    color: var(--hana-primary);
  }
`;

const ProductTitle = styled.h3`
  font-size: var(--hana-font-size-lg);
  font-weight: 700;
  color: var(--hana-text-primary);
  margin: 0 0 var(--hana-space-1) 0;
  line-height: 1.3;
`;

const ProductDescription = styled.p`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-gray);
  margin: 0;
  line-height: 1.4;
`;

const ProductRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--hana-space-2);
  min-width: 400px;
`;

const RateInfo = styled.div`
  text-align: right;
`;

const RateTerm = styled.div`
  font-size: var(--hana-font-size-xs);
  color: var(--hana-gray);
  margin-bottom: var(--hana-space-1);
`;

const RateValue = styled.div`
  font-size: var(--hana-font-size-xl);
  font-weight: 700;
  color: var(--hana-primary);
  line-height: 1.2;
`;

const SubscribeButton = styled.button`
  background: var(--hana-primary);
  color: var(--hana-white);
  border: none;
  padding: var(--hana-space-3) var(--hana-space-4);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--hana-transition-base);
  min-width: 120px;
  white-space: nowrap;
  height: 40px;

  &:hover {
    background: var(--hana-primary-dark);
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--hana-light-gray);
    color: var(--hana-gray);
    cursor: not-allowed;
    transform: none;
  }
`;

// 기존 카드 형식 스타일 제거됨 - 리스트 형식으로 대체

const ComparisonBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    135deg,
    var(--hana-white),
    var(--hana-primary-light)
  );
  border-top: 3px solid var(--hana-primary);
  padding: var(--hana-space-4) var(--hana-space-8);
  box-shadow: var(--hana-shadow-heavy);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(10px);
`;

const ComparisonItems = styled.div`
  display: flex;
  gap: var(--hana-space-4);
  align-items: center;

  > span {
    font-weight: 700;
    color: var(--hana-primary);
    font-size: var(--hana-font-size-lg);
  }
`;

const ComparisonItem = styled.div`
  background: linear-gradient(135deg, var(--hana-primary), var(--hana-mint));
  color: var(--hana-white);
  padding: var(--hana-space-2) var(--hana-space-4);
  border-radius: var(--hana-radius-full);
  font-size: var(--hana-font-size-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);
  box-shadow: var(--hana-shadow-light);

  &:hover {
    transform: scale(1.05);
  }
`;

const RemoveButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: var(--hana-white);
  cursor: pointer;
  font-size: var(--hana-font-size-lg);
  width: 24px;
  height: 24px;
  border-radius: var(--hana-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--hana-transition-base);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const BottomCompareButton = styled.button`
  background: linear-gradient(135deg, var(--hana-orange), var(--hana-primary));
  color: var(--hana-white);
  border: none;
  padding: var(--hana-space-4) var(--hana-space-8);
  border-radius: var(--hana-radius-md);
  font-size: var(--hana-font-size-lg);
  font-weight: 700;
  font-family: var(--hana-font-family);
  cursor: pointer;
  transition: all var(--hana-transition-base);
  box-shadow: var(--hana-shadow-light);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--hana-shadow-medium);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: hanaFadeIn 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: var(--hana-white);
  width: 95%;
  max-width: 900px;
  max-height: 90%;
  overflow-y: auto;
  border-radius: var(--hana-radius-xl);
  padding: var(--hana-space-8);
  position: relative;
  box-shadow: var(--hana-shadow-heavy);
  border: var(--hana-border-light);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  line-height: 1.6;
  color: #333;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--hana-space-8);
  padding-bottom: var(--hana-space-6);
  border-bottom: 2px solid #e5e7eb;
  background: #f8fafc;
  margin: calc(-1 * var(--hana-space-8)) calc(-1 * var(--hana-space-8))
    var(--hana-space-8);
  padding: var(--hana-space-6) var(--hana-space-8);
  border-radius: var(--hana-radius-xl) var(--hana-radius-xl) 0 0;
`;

const ModalTitle = styled.h2`
  color: #1f2937;
  font-size: var(--hana-font-size-3xl);
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--hana-space-3);

  &::before {
    content: "🏦";
    font-size: var(--hana-font-size-2xl);
  }
`;

const CloseButton = styled.button`
  background: #ffffff;
  border: 1px solid #d1d5db;
  font-size: var(--hana-font-size-2xl);
  cursor: pointer;
  color: #6b7280;
  width: 40px;
  height: 40px;
  border-radius: var(--hana-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--hana-transition-base);
  font-weight: 500;

  &:hover {
    color: #374151;
    border-color: #9ca3af;
    background: #f9fafb;
    transform: scale(1.05);
  }
`;

const DetailSection = styled.div`
  margin-bottom: var(--hana-space-6);
  padding: var(--hana-space-4);
  background: #ffffff;
  border-radius: var(--hana-radius-lg);
  border-left: 3px solid #3b82f6;
  border: 1px solid #e5e7eb;

  h3 {
    color: #1f2937;
    margin-bottom: var(--hana-space-3);
    font-size: var(--hana-font-size-xl);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--hana-space-2);

    &::before {
      content: "▶";
      color: #3b82f6;
    }
  }

  p {
    line-height: 1.7;
    color: #374151;
    font-weight: 400;
    font-size: var(--hana-font-size-base);
  }
`;

const formatCurrency = (amount) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
};

const formatRate = (rate) => {
  if (!rate) return "-";
  return rate.toFixed(2) + "%";
};

const getProductIcon = (type) => {
  return productIcons[type] || "📄";
};

const ProductExplorer = ({
  onScreenSync,
  onProductSelected,
  onApiFormsReceived,
  customerId,
  stompClient,
  sessionId,
  highlights = [],
  customerData,
  employeeData,
}) => {
  console.log("🚀 [ProductExplorer] 컴포넌트 렌더링됨");
  console.log("🚀 [ProductExplorer] onScreenSync:", !!onScreenSync);
  console.log("🚀 [ProductExplorer] onProductSelected:", !!onProductSelected);
  console.log("🚀 [ProductExplorer] stompClient:", !!stompClient);
  console.log("🚀 [ProductExplorer] sessionId:", sessionId);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [comparisonList, setComparisonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);

  // 상품의 우대금리 정보를 rateOptions 형식으로 변환
  const convertBenefitsToRateOptions = (product) => {
    if (!product || !product.benefits) return [];

    return product.benefits
      .filter((benefit) => benefit.benefitType === "RATE_INCREASE")
      .map((benefit, index) => ({
        id: benefit.benefitId || `benefit_${index}`,
        name: benefit.benefitName,
        rate: parseFloat(benefit.applicableValue) * 100, // 백분율로 변환
        description:
          benefit.description ||
          `${benefit.benefitName} 시 ${(benefit.applicableValue * 100).toFixed(
            2
          )}%p 추가`,
      }));
  };

  // 상품 상세 정보에서 실제 우대금리 데이터를 가져오는 함수
  const fetchProductDetails = async (productId) => {
    try {
      console.log("🔍 fetchProductDetails 시작:", productId);
      const response = await fetch(
        `/api/employee/products/${productId}/details`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("🔍 API 응답:", result);

      if (result.success && result.data?.detailedInfo?.preferentialRates) {
        console.log(
          "🔍 preferentialRates 원본:",
          result.data.detailedInfo.preferentialRates
        );
        const preferentialRates = JSON.parse(
          result.data.detailedInfo.preferentialRates
        );
        console.log("🔍 파싱된 preferentialRates:", preferentialRates);

        const rateOptions = preferentialRates.map((rate, index) => ({
          id: `preferential_${index}`,
          name: rate.item,
          rate: parseFloat(rate.rate_value),
          description: rate.description,
        }));
        console.log("🔍 최종 rateOptions:", rateOptions);
        return rateOptions;
      }
      console.log("🔍 preferentialRates가 없음");
      return [];
    } catch (error) {
      console.error("상품 상세 정보 조회 중 오류:", error);
      return [];
    }
  };

  // 리스트 형식 필터 상태
  const [onlineFilter, setOnlineFilter] = useState(false);
  const [sortBy, setSortBy] = useState("rate"); // "rate" 또는 "release"

  // 하이라이트 기능
  const highlightElement = (
    elementId,
    highlightType = "highlight",
    color = "#ffff00"
  ) => {
    if (stompClient && sessionId && stompClient.active) {
      stompClient.publish({
        destination: "/app/screen-highlight",
        body: JSON.stringify({
          sessionId: sessionId,
          elementId: elementId,
          highlightType: highlightType,
          color: color,
        }),
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedType, onlineFilter, sortBy]);

  // 실제 금리 조회 함수
  const getActualInterestRate = (productName, baseRate) => {
    const rates = getProductInterestRates(productName);

    if (rates.length === 0) {
      // 기본 상품 데이터에서 금리 정보 추출
      const productDetail = productDetails[productName];
      if (productDetail && productDetail.interestRate) {
        return productDetail.interestRate;
      }
      return baseRate || "문의 필요";
    }

    // 가장 일반적인 기간(1년 또는 12개월)의 금리를 우선 조회
    const commonRate = getBestRateForPeriod(productName, 12);
    if (commonRate) {
      return `${commonRate.rateDisplay}`;
    }

    // 첫 번째 금리 반환
    return rates[0].rateDisplay;
  };

  // 상품별 금리 상세 정보 조회
  const getRateDetails = (productName) => {
    const rates = getProductInterestRates(productName);
    return rates;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Supabase에서 우대금리 정보가 포함된 상품 데이터 가져오기
      const response = await fetch(
        "/api/employee/products/supabase/with-benefits"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Supabase 데이터를 프론트엔드 형식으로 변환
        const supabaseProducts = result.data.map((product, index) => {
          // 기존 상세 정보가 있는지 확인
          const detail = productDetails[product.productName];

          // 우대금리 정보 처리
          let preferentialRateText = "해당없음";
          if (product.benefits && product.benefits.length > 0) {
            const rateBenefits = product.benefits.filter(
              (benefit) => benefit.benefitType === "RATE_INCREASE"
            );
            if (rateBenefits.length > 0) {
              preferentialRateText = rateBenefits
                .map(
                  (benefit) =>
                    `${benefit.benefitName} +${(
                      benefit.applicableValue * 100
                    ).toFixed(2)}%`
                )
                .join(", ");
            }
          }

          return {
            id: index + 1,
            productId: product.productId,
            product_name: product.productName,
            product_type: product.productType,
            product_features: detail?.productFeatures || "상세 정보 없음",
            target_customers: detail?.targetCustomers || "일반 고객",
            deposit_period: detail?.depositPeriod || "문의 필요",
            deposit_amount: detail?.depositAmount || "문의 필요",
            interest_rate: product.baseRate
              ? `${product.baseRate}%`
              : "시장금리 연동",
            preferential_rate: preferentialRateText,
            tax_benefits: detail?.taxBenefits || "해당없음",
            withdrawal_conditions: detail?.withdrawalConditions || "문의 필요",
            notes: detail?.notes || "상세 정보는 고객센터로 문의하세요",
            eligibility_requirements: detail?.targetCustomers || "일반 고객",
            sales_status: product.salesStatus,
            min_amount: product.minAmount,
            max_amount: product.maxAmount,
            document_name: product.documentName,
            document_path: product.documentPath,
            benefits: product.benefits || [], // 우대금리 정보 추가
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        setProducts(supabaseProducts);
        console.log(
          "Supabase 상품 데이터 로드 완료 (우대금리 포함):",
          supabaseProducts.length,
          "개"
        );
      } else {
        // Supabase API 실패 시 기존 로컬 데이터 사용
        console.warn("Supabase API 실패, 로컬 데이터 사용");
        await fetchLocalProducts();
      }
    } catch (error) {
      console.error("Supabase 상품 데이터 로드 중 오류:", error);
      // 오류 발생 시 기존 로컬 데이터 사용
      await fetchLocalProducts();
    } finally {
      setLoading(false);
    }
  };

  // 기존 로컬 데이터 로드 함수 (백업용)
  const fetchLocalProducts = async () => {
    try {
      const hanaProducts = [];

      // 카테고리별 상품을 변환
      Object.entries(productCategories).forEach(([category, products]) => {
        products.forEach((productName) => {
          const detail = productDetails[productName];
          const actualRate = getActualInterestRate(
            productName,
            detail?.interestRate
          );

          if (detail) {
            hanaProducts.push({
              id: hanaProducts.length + 1,
              productId: `hana_${productName
                .replace(/\s+/g, "_")
                .toLowerCase()}`,
              product_name: productName,
              product_type: category,
              product_features: detail.productFeatures,
              target_customers: detail.targetCustomers,
              deposit_period: detail.depositPeriod,
              deposit_amount: detail.depositAmount,
              interest_rate: actualRate,
              preferential_rate: detail.preferentialRate,
              tax_benefits: detail.taxBenefits,
              withdrawal_conditions: detail.withdrawalConditions,
              notes: detail.notes,
              eligibility_requirements: detail.targetCustomers,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            // 상세 정보가 없는 경우 기본 정보만 제공
            hanaProducts.push({
              id: hanaProducts.length + 1,
              productId: `hana_${productName
                .replace(/\s+/g, "_")
                .toLowerCase()}`,
              product_name: productName,
              product_type: category,
              product_features: "상세 정보 없음",
              target_customers: "일반 고객",
              deposit_period: "문의 필요",
              deposit_amount: "문의 필요",
              interest_rate: "시장금리 연동",
              preferential_rate: "해당없음",
              tax_benefits: "해당없음",
              withdrawal_conditions: "문의 필요",
              notes: "상세 정보는 고객센터로 문의하세요",
              eligibility_requirements: "일반 고객",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });
      });

      setProducts(hanaProducts);
      console.log("로컬 상품 데이터 로드 완료:", hanaProducts.length, "개");
    } catch (error) {
      console.error("로컬 상품 데이터 로드 중 오류:", error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          (product.product_name &&
            product.product_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (product.product_features &&
            product.product_features
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType) {
      filtered = filtered.filter(
        (product) => product.product_type === selectedType
      );
    }

    // 온라인 가입 상품 필터
    if (onlineFilter) {
      filtered = filtered.filter((product) => {
        // 온라인 가입 가능한 상품 필터링 (예: 상품명에 "온라인" 포함 또는 특정 조건)
        return (
          product.product_name?.includes("온라인") ||
          product.product_features?.includes("온라인") ||
          product.product_name?.includes("하나원큐") ||
          product.product_name?.includes("스마트폰")
        );
      });
    }

    // 정렬 로직
    filtered = filtered.sort((a, b) => {
      if (sortBy === "rate") {
        // 우대 금리 기준으로 정렬 (높은 순)
        const getMaxRate = (product) => {
          // 기본 금리에서 숫자 추출
          const baseRate = parseFloat(
            product.interest_rate?.toString().replace(/[^0-9.]/g, "") || "0"
          );

          // 우대 금리에서 숫자 추출
          const preferentialRate = product.preferential_rate?.toString() || "";
          const preferentialMatch = preferentialRate.match(/(\d+\.?\d*)/g);
          const maxPreferential = preferentialMatch
            ? Math.max(...preferentialMatch.map(Number))
            : 0;

          // 최고 금리 계산 (기본 + 최대 우대)
          return baseRate + maxPreferential;
        };

        const rateA = getMaxRate(a);
        const rateB = getMaxRate(b);

        return rateB - rateA; // 내림차순 정렬 (높은 금리부터)
      } else if (sortBy === "release") {
        // 출시순 정렬 (최신순)
        return (
          new Date(b.created_at || b.updated_at) -
          new Date(a.created_at || a.updated_at)
        );
      }
      return 0;
    });

    setFilteredProducts(filtered);
  };

  const addToComparison = (product) => {
    console.log("🔍 [ProductExplorer] addToComparison 호출됨:", product);
    console.log("🔍 [ProductExplorer] 현재 comparisonList:", comparisonList);
    console.log(
      "🔍 [ProductExplorer] comparisonList.length:",
      comparisonList.length
    );

    if (
      comparisonList.length < 3 &&
      !comparisonList.find((p) => p.id === product.id)
    ) {
      const newList = [...comparisonList, product];
      console.log("🔍 [ProductExplorer] 새로운 comparisonList:", newList);
      setComparisonList(newList);

      // 고객 화면에 동기화
      onScreenSync({
        type: "product-comparison-updated",
        data: newList,
      });
      console.log("✅ [ProductExplorer] 상품이 비교 목록에 추가됨");
    } else {
      console.log(
        "⚠️ [ProductExplorer] 상품 추가 실패 - 이미 3개이거나 중복됨"
      );
    }
  };

  const removeFromComparison = (productId) => {
    const newList = comparisonList.filter((p) => p.id !== productId);
    setComparisonList(newList);

    // 고객 화면에 동기화
    onScreenSync({
      type: "product-comparison-updated",
      data: newList,
    });
  };

  const handleCompare = () => {
    console.log("🔍 [ProductExplorer] handleCompare 호출됨");
    console.log("🔍 [ProductExplorer] comparisonList:", comparisonList);
    console.log(
      "🔍 [ProductExplorer] comparisonList.length:",
      comparisonList.length
    );

    if (comparisonList.length >= 2) {
      console.log(
        "🔍 [ProductExplorer] 비교분석 시작 - 상품 개수:",
        comparisonList.length
      );

      // 행원 PC에서 비교분석 모달 열기
      setShowAnalysisModal(true);
      console.log("🔍 [ProductExplorer] 행원 PC 모달 열기 완료");

      // 태블릿에도 비교분석 모달 열기
      const syncData = {
        type: "show-comparison",
        data: {
          products: comparisonList,
          selectedProducts: comparisonList,
          customerProduct: null,
          simulationAmount: 1000000,
          simulationPeriod: 12,
        },
      };

      console.log("🔍 [ProductExplorer] onScreenSync 호출:", syncData);
      onScreenSync(syncData);
      console.log("🔍 [ProductExplorer] onScreenSync 호출 완료");
    } else {
      console.log(
        "⚠️ [ProductExplorer] 비교할 상품이 부족함:",
        comparisonList.length
      );
    }
  };

  // 상품 ID 매핑 함수
  const getProductIdMapping = () => {
    return {
      "3·6·9 정기예금": "P033",
      "(내맘) 적금": "P084_내맘_적금",
      "급여하나 월복리 적금": "P004",
      "달달 하나 적금": "P001_급여하나월복리적금",
      "대전하나 축구사랑 적금": "P048",
      "도전365 적금": "P089_도전_365_적금",
      "부자씨 적금": "P046",
      "손님케어 적금": "P031",
      "하나 아이키움 적금": "P047",
      "하나 중소기업재직자 우대저축": "P078_하나_중소기업재직자_우대저축",
      "내집마련 더블업(Double-Up)적금": "P093_내집마련더블업적금",
      "청년 주택드림 청약통장": "P051",
      청년주택드림청약통장: "P051",
      "하나 청년도약계좌": "P049",
    };
  };

  // 실제 product_details 데이터 시뮬레이션 함수
  const getSimulatedProductDetails = (productName) => {
    const productDetailsMap = {
      "급여하나 월복리 적금": {
        productName: "급여하나 월복리 적금",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=001",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.0,
          max_rate: 4.15,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.0,
          preferential_rate: 2.15,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "급여하나 우대",
            rate_value: 0.9,
            description: "급여하나 계좌 보유 시",
          },
          {
            item: "온라인 재예치 우대",
            rate_value: 0.1,
            description: "온라인에서 재예치 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "급여이체와 함께하는 월복리 적금",
          targetCustomers: "급여이체 고객",
          depositPeriod: "1년, 2년, 3년",
          depositAmount: "1만원 이상 300만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "하나더이지 적금": {
        productName: "하나더이지 적금",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=002",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 1.8,
          max_rate: 3.5,
        }),
        appliedRates: JSON.stringify({
          base_rate: 1.8,
          preferential_rate: 1.7,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "해외송금 건수 우대",
            rate_value: 0.5,
            description: "월 3건 이상 해외송금 시",
          },
          {
            item: "급여이체 우대",
            rate_value: 0.3,
            description: "급여이체 시",
          },
          {
            item: "하나카드 결제 우대",
            rate_value: 0.2,
            description: "하나카드 결제 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "해외송금과 함께하는 적금",
          targetCustomers: "해외송금 이용 고객",
          depositPeriod: "1년, 2년",
          depositAmount: "1만원 이상 200만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "하나 아이키움 적금": {
        productName: "하나 아이키움 적금",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=003",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.2,
          max_rate: 4.8,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.2,
          preferential_rate: 2.6,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "양육수당 수급",
            rate_value: 1.0,
            description: "양육수당 수급자",
          },
          {
            item: "임산부",
            rate_value: 0.8,
            description: "임산부",
          },
          {
            item: "아이 미래 지킴 서약",
            rate_value: 0.5,
            description: "아이 미래 지킴 서약 체결 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "아이를 위한 특별한 적금",
          targetCustomers: "양육수당 수급자, 임산부",
          depositPeriod: "1년, 2년, 3년",
          depositAmount: "1만원 이상 500만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "달달 하나 적금": {
        productName: "달달 하나 적금",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=004",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 1.9,
          max_rate: 3.2,
        }),
        appliedRates: JSON.stringify({
          base_rate: 1.9,
          preferential_rate: 1.3,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "신규고객 우대",
            rate_value: 0.8,
            description: "1년간 예적금 미보유 고객",
          },
          {
            item: "온라인 가입 우대",
            rate_value: 0.3,
            description: "온라인에서 가입 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "신규고객을 위한 달달한 적금",
          targetCustomers: "신규고객",
          depositPeriod: "1년, 2년",
          depositAmount: "1만원 이상 200만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "청년 주택드림 청약통장": {
        productName: "청년 주택드림 청약통장",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=051",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.5,
          max_rate: 4.5,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.5,
          preferential_rate: 2.0,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "청년 우대",
            rate_value: 1.5,
            description: "만 19세 이상 39세 이하 청년",
          },
          {
            item: "무주택자 우대",
            rate_value: 0.5,
            description: "무주택자",
          },
          {
            item: "신규가입 우대",
            rate_value: 0.3,
            description: "신규 가입 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "청년을 위한 주택구입자금 적립 상품",
          targetCustomers: "만 19세 이상 39세 이하 청년",
          depositPeriod: "1년, 2년, 3년, 5년",
          depositAmount: "1만원 이상 200만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "(내맘) 적금": {
        productName: "(내맘) 적금",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=084",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.1,
          max_rate: 3.8,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.1,
          preferential_rate: 1.7,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "급여이체 우대",
            rate_value: 0.8,
            description: "급여이체 시",
          },
          {
            item: "자동이체 우대",
            rate_value: 0.5,
            description: "자동이체 설정 시",
          },
          {
            item: "온라인 가입 우대",
            rate_value: 0.4,
            description: "온라인에서 가입 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "고객이 원하는 조건으로 가입하는 적금",
          targetCustomers: "실명의 개인 또는 개인사업자",
          depositPeriod: "1년, 2년, 3년",
          depositAmount: "1만원 이상 300만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "하나 청년도약계좌": {
        productName: "하나 청년도약계좌",
        productUrl: "https://www.hanabank.com/product/detail.do?prdCd=049",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.3,
          max_rate: 4.2,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.3,
          preferential_rate: 1.9,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "청년 우대",
            rate_value: 1.2,
            description: "만 19세 이상 34세 이하 청년",
          },
          {
            item: "신규고객 우대",
            rate_value: 0.5,
            description: "신규 고객",
          },
          {
            item: "자동이체 우대",
            rate_value: 0.2,
            description: "자동이체 설정 시",
          },
        ]),
        productInfo: JSON.stringify({
          description: "청년을 위한 도약계좌 적금",
          targetCustomers: "만 19세 이상 34세 이하 청년",
          depositPeriod: "1년, 2년, 3년",
          depositAmount: "1만원 이상 200만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
      "(K리그) 우승 적금": {
        productName: "(K리그) 우승 적금",
        productUrl: "https://www.kebhana.com/cont/mall/mal",
        category: "적금",
        basicRates: JSON.stringify({
          base_rate: 2.0,
          max_rate: 7.0,
        }),
        appliedRates: JSON.stringify({
          base_rate: 2.0,
          preferential_rate: 5.0,
        }),
        preferentialRates: JSON.stringify([
          {
            item: "축덕카드 사용",
            rate_value: 1.0,
            description:
              "이 예금 가입일로부터 가입연도말까지 하나 축덕카드(신용/체크)사용 실적을 10회 이상 보유한 경우",
          },
          {
            item: "성공한 덕후(응원팀 우승)",
            rate_value: 1.0,
            description:
              "이 예금 가입시 선택한 나의 응원팀이 가입연도 해당 시즌 최종 우승한 경우",
          },
          {
            item: "너DO?나DO! (친구초대) - 11명 완성",
            rate_value: 2.0,
            description:
              "11명 완성 - 나의 초대코드로 친구가 같이 가입하여 My팀을 구성한 팀원 모두에게 우대금리 제공",
          },
          {
            item: "너DO?나DO! (친구초대) - 6~10명",
            rate_value: 1.0,
            description:
              "6~10명 - 나의 초대코드로 친구가 같이 가입하여 My팀을 구성한 팀원 모두에게 우대금리 제공",
          },
          {
            item: "너DO?나DO! (친구초대) - 2~5명",
            rate_value: 0.5,
            description:
              "2~5명 - 나의 초대코드로 친구가 같이 가입하여 My팀을 구성한 팀원 모두에게 우대금리 제공",
          },
          {
            item: "하나원큐 축구Play 참여",
            rate_value: 1.0,
            description:
              "이 예금 가입일로부터 가입연도말까지 「하나원큐 축구Play」콘텐츠 참여횟수에 따라 제공되는 총 11개 아이템을 모두 모은 경우",
          },
        ]),
        productInfo: JSON.stringify({
          description: "K리그 응원과 함께하는 특별한 적금",
          targetCustomers: "K리그 팬, 축구 애호가",
          depositPeriod: "1년, 2년, 3년",
          depositAmount: "1만원 이상 300만원 이하",
        }),
        crawledAt: new Date().toISOString(),
      },
    };

    return productDetailsMap[productName] || null;
  };

  const handleProductDetail = async (product) => {
    console.log("🚀 === 고객에게 보여주기 클릭 시작 ===");
    console.log("클릭한 상품 전체:", JSON.stringify(product, null, 2));
    console.log("상품명:", product.productName || product.product_name);

    try {
      // 상품 상세 정보 조회 제거됨 - 404 오류 방지
      console.log("🔍 상품 상세 정보 조회 제거됨 - 기본 정보 사용");

      let productWithDetails = { ...product };

      // 기본 정보 사용 (API 호출 제거됨)
      console.log("📊 기본 상품 정보 사용");
      productWithDetails = {
        ...product,
        hasDetailedInfo: false,
      };

      // 상품 설명서 정보 조회 제거됨 - 404 오류 방지
      console.log("🔍 상품 설명서 정보 조회 제거됨 - 기본 정보 사용");

      // 상품 설명서 정보는 기본값으로 설정
      productWithDetails = {
        ...productWithDetails,
        documentInfo: null,
      };

      // ProductVisualization 모달 표시 (막대바로 상품 가격 비교하는 모달)
      setSelectedProduct(productWithDetails);
      setShowVisualization(true);

      // 원래 있던 방식: onScreenSync를 통해 product-detail-sync 메시지 전송
      if (onScreenSync) {
        onScreenSync({
          type: "product-detail-sync",
          data: productWithDetails,
        });
        console.log(
          "📱 onScreenSync를 통해 product-detail-sync 메시지 전송 완료"
        );
      }
    } catch (error) {
      console.error("❌ 상품 상세 정보 조회 중 오류:", error);

      // 오류 발생 시 시뮬레이션 데이터 사용
      console.log("📊 오류 발생, 시뮬레이션 데이터 사용");
      const simulatedDetails = getSimulatedProductDetails(
        product.productName || product.product_name
      );

      let productWithDetails = { ...product };
      if (simulatedDetails) {
        console.log("📊 시뮬레이션 상품 상세 정보 발견:", simulatedDetails);
        productWithDetails = {
          ...product,
          hasDetailedInfo: true,
          detailedInfo: simulatedDetails,
        };
      } else {
        console.log("📊 시뮬레이션 데이터도 없음, 기본 정보 사용");
        productWithDetails = {
          ...product,
          hasDetailedInfo: false,
        };
      }

      setSelectedProduct(productWithDetails);
      setShowProductModal(true);
    }
  };

  // 하나은행 상품 카테고리 사용
  const productTypes = Object.keys(productCategories);

  if (loading) {
    return (
      <ExplorerContainer>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner"></div>
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </ExplorerContainer>
    );
  }

  return (
    <>
      <ExplorerContainer>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="상품명 또는 설명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">전체 상품</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {getProductIcon(type)} {type}
              </option>
            ))}
          </FilterSelect>
        </SearchBar>

        {/* 리스트 형식 헤더 */}
        <ListHeader>
          <HeaderTop>
            <ComparisonSection>
              <CompareButton
                onClick={handleCompare}
                disabled={comparisonList.length < 2}
              >
                비교하기
              </CompareButton>
              <CompareText>최대 3개까지 비교가능</CompareText>
            </ComparisonSection>
          </HeaderTop>

          <HeaderMain>
            <TitleSection>
              <MainTitle>
                전체 {filteredProducts.length}개 {selectedType || "상품"}
              </MainTitle>
              <DateInfo>
                (조회기준일자 : {new Date().toLocaleDateString("ko-KR")},
                우대금리포함)
              </DateInfo>
            </TitleSection>

            <FilterTabs>
              <FilterTab
                active={onlineFilter}
                onClick={() => setOnlineFilter(!onlineFilter)}
              >
                온라인 가입상품
              </FilterTab>
              <FilterTab
                active={sortBy === "release"}
                onClick={() =>
                  setSortBy(sortBy === "release" ? "rate" : "release")
                }
              >
                출시순
              </FilterTab>
            </FilterTabs>
          </HeaderMain>
        </ListHeader>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--hana-dark-gray)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏦</div>
            <h3>하나은행 상품 정보를 불러오는 중...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--hana-dark-gray)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
            <h3>검색 결과가 없습니다</h3>
            <p>다른 키워드로 검색하거나 필터를 변경해보세요.</p>
          </div>
        ) : (
          <ProductList>
            {filteredProducts.map((product, index) => {
              // 최고 금리 계산
              const getMaxRate = (product) => {
                const baseRate = parseFloat(
                  product.interest_rate?.toString().replace(/[^0-9.]/g, "") ||
                    "0"
                );
                const preferentialRate =
                  product.preferential_rate?.toString() || "";
                const preferentialMatch =
                  preferentialRate.match(/(\d+\.?\d*)/g);
                const maxPreferential = preferentialMatch
                  ? Math.max(...preferentialMatch.map(Number))
                  : 0;
                return baseRate + maxPreferential;
              };

              const maxRate = getMaxRate(product);
              const isSelected = comparisonList.find(
                (p) => p.id === product.id
              );
              const canSelect = comparisonList.length < 3 || isSelected;

              // 상품 태그 생성
              const getProductTags = (product) => {
                const tags = [];
                const productType = product.productType || product.product_type;

                // 기본 상품 타입 태그
                if (productType) {
                  tags.push({ text: productType, type: "primary" });
                }

                // 채널 태그 (상품명이나 특징에서 추출)
                const productName =
                  product.productName || product.product_name || "";
                const features =
                  product.productFeatures || product.product_features || "";

                if (
                  productName.includes("하나원큐") ||
                  features.includes("스마트폰")
                ) {
                  tags.push({ text: "스마트폰", type: "secondary" });
                }
                if (
                  productName.includes("온라인") ||
                  features.includes("온라인")
                ) {
                  tags.push({ text: "인터넷", type: "secondary" });
                }
                if (
                  features.includes("영업점") ||
                  !productName.includes("온라인")
                ) {
                  tags.push({ text: "영업점", type: "secondary" });
                }

                return tags;
              };

              const tags = getProductTags(product);

              return (
                <ProductListItem key={product.id}>
                  <ProductItemContent>
                    <ProductLeft>
                      <ProductCheckbox
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => {
                          if (isSelected) {
                            removeFromComparison(product.id);
                          } else if (canSelect) {
                            addToComparison(product);
                          }
                        }}
                        disabled={!canSelect && !isSelected}
                      />

                      <ProductInfo>
                        <ProductTags>
                          {tags.map((tag, tagIndex) => (
                            <ProductTag key={tagIndex} className={tag.type}>
                              {tag.text}
                            </ProductTag>
                          ))}
                        </ProductTags>

                        <ProductTitle>
                          {product.productName || product.product_name}
                        </ProductTitle>

                        <ProductDescription>
                          {product.productFeatures || product.product_features}
                        </ProductDescription>
                      </ProductInfo>
                    </ProductLeft>

                    <ProductRight>
                      <RateInfo>
                        <RateTerm>연(세전, 1년)</RateTerm>
                        <RateValue>
                          {(() => {
                            // 실제 금리 계산
                            const getDisplayRate = (product) => {
                              // 1. 먼저 실제 금리 데이터에서 조회
                              const actualRate = getActualInterestRate(
                                product.productName || product.product_name,
                                product.interestRate || product.interest_rate
                              );

                              // 2. 실제 금리 데이터가 있으면 사용
                              if (
                                actualRate &&
                                actualRate !== "문의 필요" &&
                                actualRate !== "시장금리 연동"
                              ) {
                                // 금리 문자열에서 숫자 추출
                                const rateMatch =
                                  actualRate.match(/(\d+\.?\d*)/g);
                                if (rateMatch && rateMatch.length > 0) {
                                  const rates = rateMatch.map(Number);
                                  const maxRate = Math.max(...rates);
                                  return `${maxRate.toFixed(2)}%`;
                                }
                                return actualRate;
                              }

                              // 3. 기본 금리에서 숫자 추출
                              const baseRate = parseFloat(
                                (
                                  product.interest_rate ||
                                  product.interestRate ||
                                  "0"
                                )
                                  .toString()
                                  .replace(/[^0-9.]/g, "")
                              );

                              // 4. 우대 금리에서 숫자 추출
                              const preferentialRate = (
                                product.preferential_rate ||
                                product.preferentialRate ||
                                ""
                              ).toString();
                              const preferentialMatch =
                                preferentialRate.match(/(\d+\.?\d*)/g);
                              const maxPreferential = preferentialMatch
                                ? Math.max(...preferentialMatch.map(Number))
                                : 0;

                              // 5. 최고 금리 계산 (기본 + 최대 우대)
                              const totalRate = baseRate + maxPreferential;

                              if (totalRate > 0) {
                                return `${totalRate.toFixed(2)}%`;
                              } else if (baseRate > 0) {
                                return `${baseRate.toFixed(2)}%`;
                              } else {
                                return "문의 필요";
                              }
                            };

                            return getDisplayRate(product);
                          })()}
                        </RateValue>
                      </RateInfo>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "8px",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <SubscribeButton
                          onClick={async () => {
                            console.log("📱 고객에게 보여주기 클릭:", product);

                            // 실제 우대금리 데이터 가져오기
                            const realRateOptions = await fetchProductDetails(
                              product.productId
                            );
                            console.log(
                              "📊 실제 우대금리 데이터:",
                              realRateOptions
                            );

                            // 상품 객체에 실제 우대금리 데이터 추가
                            const productWithRealRates = {
                              ...product,
                              realRateOptions: realRateOptions,
                            };

                            console.log(
                              "🔍 productWithRealRates:",
                              productWithRealRates
                            );
                            setSelectedProduct(productWithRealRates);
                            setShowProductDetailModal(true);
                          }}
                          style={{
                            background: "var(--hana-mint)",
                            fontSize: "14px",
                            padding: "10px 16px",
                            minWidth: "120px",
                          }}
                        >
                          고객에게 보여주기
                        </SubscribeButton>

                        <SubscribeButton
                          onClick={async () => {
                            console.log("상품설명서 PDF 보기:", product);

                            try {
                              // Supabase Storage의 public URL 직접 사용 (HEAD 체크 제거)
                              const fileName = "1.pdf";
                              const { data: publicUrl } = supabase.storage
                                .from("hana_product")
                                .getPublicUrl(fileName);

                              const pdfPublicUrl = publicUrl?.publicUrl;
                              console.log("📄 PDF Public URL:", pdfPublicUrl);

                              // PDF 뷰어 기능 제거됨
                            } catch (error) {
                              console.error("❌ PDF 로드 실패:", error);
                              alert("상품설명서를 불러오는데 실패했습니다.");
                            }
                          }}
                          style={{
                            background: "var(--hana-primary)",
                            fontSize: "14px",
                            padding: "10px 16px",
                            minWidth: "120px",
                          }}
                        >
                          서식PDF 보여주기
                        </SubscribeButton>

                        <SubscribeButton
                          onClick={async () => {
                            // 상품 가입하기 로직
                            console.log("상품 가입하기:", product);

                            try {
                              // 1. 백엔드 API에서 해당 상품의 서식 데이터 가져오기
                              // 상품 ID를 간단하게 설정 (한글 상품명 대신)
                              const productId = "P001"; // 모든 상품에 대해 동일한 서식 사용
                              console.log(
                                "🔍 [ProductExplorer] 상품 서식 API 호출 시작:",
                                productId
                              );
                              console.log(
                                "🔍 [ProductExplorer] 원본 상품 정보:",
                                product
                              );
                              console.log(
                                "🔍 [ProductExplorer] API URL:",
                                `/forms/byProductId/${productId}`
                              );

                              const response = await fetch(
                                `/forms/byProductId/${productId}`
                              );

                              console.log(
                                "🔍 [ProductExplorer] API 응답 상태:",
                                response.status,
                                response.statusText
                              );

                              if (!response.ok) {
                                throw new Error(
                                  `HTTP error! status: ${response.status}`
                                );
                              }

                              const result = await response.json();
                              console.log(
                                "✅ [ProductExplorer] 상품 서식 API 응답:",
                                result
                              );
                              console.log(
                                "✅ [ProductExplorer] API 응답 데이터 개수:",
                                result.data?.length
                              );

                              if (
                                result.success &&
                                result.data &&
                                result.data.length > 0
                              ) {
                                // 2. API에서 받은 서식 데이터를 FormManager로 전달
                                if (onApiFormsReceived) {
                                  onApiFormsReceived(result.data);
                                  console.log(
                                    "✅ [ProductExplorer] API 서식 데이터를 FormManager로 전달 완료:",
                                    result.data.length,
                                    "개"
                                  );
                                } else {
                                  console.warn(
                                    "⚠️ [ProductExplorer] onApiFormsReceived 함수가 없음"
                                  );
                                }
                              } else {
                                console.warn(
                                  "⚠️ [ProductExplorer] API에서 서식 데이터를 받지 못함, 기본 서식 사용"
                                );
                                console.warn(
                                  "⚠️ [ProductExplorer] result.success:",
                                  result.success
                                );
                                console.warn(
                                  "⚠️ [ProductExplorer] result.data:",
                                  result.data
                                );
                              }
                            } catch (error) {
                              console.error(
                                "❌ [ProductExplorer] 상품 서식 API 호출 실패:",
                                error
                              );
                              console.log(
                                "🔄 [ProductExplorer] 기본 서식으로 폴백"
                              );
                            }

                            // 3. 상품 선택 처리 (forms 탭으로 이동)
                            if (onProductSelected) {
                              console.log(
                                "🔍 onProductSelected 호출:",
                                product
                              );
                              onProductSelected(product);
                            }

                            // 4. 모달로 서식 표시 (탭 변경하지 않음)
                            if (onScreenSync) {
                              onScreenSync({
                                type: "show-application-form",
                                product: product,
                              });
                            }

                            console.log("✅ 상품 가입 메시지 전송 완료");
                          }}
                          style={{
                            background: "var(--hana-orange)",
                            fontSize: "14px",
                            padding: "10px 16px",
                            minWidth: "120px",
                          }}
                        >
                          가입하기
                        </SubscribeButton>
                      </div>
                    </ProductRight>
                  </ProductItemContent>
                </ProductListItem>
              );
            })}
          </ProductList>
        )}
        {filteredProducts.length === 0 && products.length > 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "16px",
              padding: "40px",
            }}
          >
            검색 조건에 맞는 상품이 없습니다.
          </div>
        )}
      </ExplorerContainer>

      {comparisonList.length > 0 && (
        <ComparisonBar>
          <ComparisonItems>
            <span>비교함 ({comparisonList.length}/3):</span>
            {comparisonList.map((product) => (
              <ComparisonItem key={product.id}>
                {product.productName || product.product_name}
                <RemoveButton onClick={() => removeFromComparison(product.id)}>
                  ×
                </RemoveButton>
              </ComparisonItem>
            ))}
          </ComparisonItems>

          <BottomCompareButton
            onClick={handleCompare}
            disabled={comparisonList.length < 2}
          >
            상품 비교하기
          </BottomCompareButton>
        </ComparisonBar>
      )}

      {/* 상품 비교분석 모달 */}
      {showAnalysisModal && (
        <ProductAnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            // 태블릿에 모달 닫기 알림 전송
            if (stompClient && stompClient.connected) {
              const closeMessage = {
                type: "product-analysis-close",
                data: { timestamp: Date.now() },
              };

              stompClient.publish({
                destination: `/topic/session/tablet_main`,
                body: JSON.stringify(closeMessage),
              });

              console.log(
                "📤 태블릿에 상품 분석 모달 닫기 알림 전송:",
                closeMessage
              );
            }
          }}
          selectedProducts={comparisonList}
          customerProduct={null}
          simulationAmount={1000000}
          simulationPeriod={12}
          stompClient={stompClient}
          sessionId={sessionId}
        />
      )}

      {/* 상품 상세 정보 모달 */}
      {showProductDetailModal && selectedProduct && (
        <ProductDetailModal
          isOpen={showProductDetailModal}
          onClose={() => {
            setShowProductDetailModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          stompClient={stompClient}
          sessionId={sessionId}
          isTablet={false}
          rateOptions={(() => {
            const rateOptions =
              selectedProduct.realRateOptions ||
              convertBenefitsToRateOptions(selectedProduct);
            console.log(
              "🔍 ProductDetailModal에 전달되는 rateOptions:",
              rateOptions
            );
            console.log(
              "🔍 selectedProduct.realRateOptions:",
              selectedProduct.realRateOptions
            );
            return rateOptions;
          })()}
        />
      )}
    </>
  );
};

export default ProductExplorer;
