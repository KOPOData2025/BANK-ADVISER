import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import ProductComparisonChart from "./ProductComparisonChart";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
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

const ModalHeader = styled.div`
  background: linear-gradient(
    135deg,
    var(--hana-mint) 0%,
    var(--hana-mint-dark) 100%
  );
  color: white;
  padding: 2rem;
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
`;

const ModalSubtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const ModalContent = styled.div`
  padding: 2rem;
`;

const SelectedProductsInfo = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SelectedProductsTitle = styled.h3`
  color: var(--hana-mint);
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProductsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ProductInfoCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-left: 4px solid ${(props) => props.color || "var(--hana-mint)"};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ProductInfoName = styled.div`
  font-weight: 600;
  color: var(--hana-black);
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const ProductInfoDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const ProductInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ProductInfoLabel = styled.span`
  color: var(--hana-dark-gray);
`;

const ProductInfoValue = styled.span`
  font-weight: 600;
  color: var(--hana-black);
`;

const AnalysisButton = styled.button`
  background: linear-gradient(
    135deg,
    var(--hana-mint) 0%,
    var(--hana-mint-dark) 100%
  );
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 132, 133, 0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ProductAnalysisModal = ({
  isOpen,
  onClose,
  selectedProducts = [],
  customerProduct = null,
  simulationAmount = 1000000,
  simulationPeriod = 12,
  stompClient = null,
  sessionId = null,
}) => {
  const [showChart, setShowChart] = useState(false);

  // selectedProducts를 메모이제이션하여 무한 루프 방지
  const memoizedSelectedProducts = useMemo(() => {
    return selectedProducts || [];
  }, [selectedProducts]);

  // 개발 모드에서만 로그 출력
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 [ProductAnalysisModal] 렌더링 상태:", {
      isOpen,
      selectedProducts: selectedProducts?.length,
      customerProduct: !!customerProduct,
      stompClient: !!stompClient,
      sessionId,
    });
  }

  // 태블릿에서는 자동으로 분석 결과 표시
  useEffect(() => {
    if (isOpen && stompClient) {
      setShowChart(true);
    } else if (isOpen && !stompClient) {
      setShowChart(false);
    }
  }, [isOpen, stompClient]);

  // 고객 선택 상품과 비교할 상품들 준비 (useMemo로 최적화)
  const allProducts = useMemo(() => {
    const products = [];

    // 개발 모드에서 디버깅 정보 출력
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [ProductAnalysisModal] allProducts 계산 시작:", {
        customerProduct: !!customerProduct,
        selectedProducts: selectedProducts?.length,
        selectedProductsData: selectedProducts,
      });
    }

    if (customerProduct) {
      products.push({
        ...customerProduct,
        isCustomerChoice: true,
        name:
          customerProduct.productName ||
          customerProduct.ProductName ||
          "고객 선택 상품",
        rate: customerProduct.finalRate || customerProduct.baseRate || 2.0,
        color: "#FF6B6B",
      });
    }

    // selectedProducts가 배열이 아니거나 비어있는 경우 처리
    const validSelectedProducts = Array.isArray(selectedProducts)
      ? selectedProducts
      : [];

    validSelectedProducts.forEach((product, index) => {
      const baseName =
        product.productName || product.ProductName || `추천 상품 ${index + 1}`;
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
          color: index === 0 ? "#4ECDC4" : index === 1 ? "#45B7D1" : "#96CEB4",
        });
      }
    });

    // 개발 모드에서 최종 결과 출력
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [ProductAnalysisModal] allProducts 계산 완료:", {
        totalProducts: products.length,
        products: products.map((p) => ({ name: p.name, rate: p.rate })),
      });
    }

    return products;
  }, [customerProduct, selectedProducts]);

  // 모달이 열릴 때 태블릿에 상품 분석 데이터 전송
  useEffect(() => {
    if (isOpen && stompClient && sessionId && customerProduct) {
      const analysisData = {
        product: customerProduct,
        selectedProducts: allProducts,
        simulationAmount: simulationAmount,
        simulationPeriod: simulationPeriod,
      };

      stompClient.publish({
        destination: `/topic/session/${sessionId}`,
        body: JSON.stringify({
          type: "product-analysis",
          data: analysisData,
          timestamp: Date.now(),
        }),
      });

      if (process.env.NODE_ENV === "development") {
        console.log("📤 태블릿에 상품 분석 데이터 전송:", analysisData);
      }
    }
  }, [
    isOpen,
    stompClient,
    sessionId,
    customerProduct?.id ||
      customerProduct?.ProductID ||
      customerProduct?.productId,
    selectedProducts?.length,
    simulationAmount,
    simulationPeriod,
  ]);

  if (!isOpen) {
    if (process.env.NODE_ENV === "development") {
      console.log("🚫 [ProductAnalysisModal] 모달이 닫혀있음 - 렌더링 중단");
    }
    return null;
  }

  const handleAnalysis = () => {
    setShowChart(true);
  };

  const handleClose = () => {
    setShowChart(false);

    // 태블릿에 모달 닫기 알림 전송
    if (stompClient && sessionId) {
      const closeMessage = {
        type: "product-analysis-close",
        data: { timestamp: Date.now() },
      };

      stompClient.publish({
        destination: `/topic/session/${sessionId}`,
        body: JSON.stringify(closeMessage),
      });

      if (process.env.NODE_ENV === "development") {
        console.log("📤 태블릿에 상품 분석 모달 닫기 알림 전송:", closeMessage);
      }
    }

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // 디버깅을 위한 상세 로그
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 [ProductAnalysisModal] 렌더링 시작:", {
      isOpen,
      allProducts: allProducts?.length,
      customerProduct: !!customerProduct,
      selectedProducts: selectedProducts?.length,
      showChart,
    });
  }

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={handleClose}>×</CloseButton>
          <ModalTitle>상품 비교 분석</ModalTitle>
          <ModalSubtitle>
            선택된 상품들의 12개월 자산 현황을 비교 분석합니다
          </ModalSubtitle>
        </ModalHeader>

        <ModalContent>
          {/* 태블릿에서는 상품 목록을 표시하지 않음 */}
          {!stompClient && (
            <SelectedProductsInfo>
              <SelectedProductsTitle>
                선택된 상품 목록 ({allProducts?.length || 0}개)
              </SelectedProductsTitle>
              <ProductsList>
                {allProducts?.map((product, index) => (
                  <ProductInfoCard key={index} color={product.color}>
                    <ProductInfoName>{product.name}</ProductInfoName>
                    <ProductInfoDetails>
                      <ProductInfoItem>
                        <ProductInfoLabel>상품 유형:</ProductInfoLabel>
                        <ProductInfoValue>
                          {product.productType || "적금"}
                        </ProductInfoValue>
                      </ProductInfoItem>
                      <ProductInfoItem>
                        <ProductInfoLabel>기본 금리:</ProductInfoLabel>
                        <ProductInfoValue>
                          {product.baseRate?.toFixed(2) || "2.00"}%
                        </ProductInfoValue>
                      </ProductInfoItem>
                      <ProductInfoItem>
                        <ProductInfoLabel>우대 금리:</ProductInfoLabel>
                        <ProductInfoValue>
                          +{product.totalPreferentialRate?.toFixed(2) || "0.00"}
                          %
                        </ProductInfoValue>
                      </ProductInfoItem>
                      <ProductInfoItem>
                        <ProductInfoLabel>최종 금리:</ProductInfoLabel>
                        <ProductInfoValue>
                          {product.rate?.toFixed(2) || "2.00"}%
                        </ProductInfoValue>
                      </ProductInfoItem>
                    </ProductInfoDetails>
                  </ProductInfoCard>
                ))}
              </ProductsList>
            </SelectedProductsInfo>
          )}

          {/* 태블릿에서는 바로 차트 표시, 행원 PC에서는 버튼 표시 */}
          {stompClient ? (
            // 태블릿 모드: 바로 차트 표시
            allProducts && allProducts.length > 0 ? (
              <ProductComparisonChart
                customerProduct={customerProduct}
                recommendedProducts={memoizedSelectedProducts}
                initialAmount={simulationAmount}
                initialPeriod={simulationPeriod}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
                <h3>상품 데이터를 불러오는 중...</h3>
                <p>잠시만 기다려주세요.</p>
                {process.env.NODE_ENV === "development" && (
                  <div
                    style={{
                      marginTop: "1rem",
                      fontSize: "0.8rem",
                      color: "#666",
                    }}
                  >
                    <p>
                      디버깅: allProducts.length = {allProducts?.length || 0}
                    </p>
                    <p>
                      selectedProducts.length = {selectedProducts?.length || 0}
                    </p>
                    <p>customerProduct = {customerProduct ? "있음" : "없음"}</p>
                  </div>
                )}
              </div>
            )
          ) : !showChart ? (
            // 행원 PC 모드: 분석 버튼 표시
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <AnalysisButton onClick={handleAnalysis}>
                12개월 자산 현황 비교 분석 시작
              </AnalysisButton>
            </div>
          ) : // 행원 PC 모드: 분석 버튼 클릭 후 차트 표시
          allProducts && allProducts.length > 0 ? (
            <ProductComparisonChart
              customerProduct={customerProduct}
              recommendedProducts={memoizedSelectedProducts}
              initialAmount={simulationAmount}
              initialPeriod={simulationPeriod}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>분석할 상품 데이터가 없습니다.</p>
            </div>
          )}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ProductAnalysisModal;
