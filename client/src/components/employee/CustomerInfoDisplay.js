import React, { useState } from "react";
import styled from "styled-components";
import PortfolioAnalysis from "../portfolio/PortfolioAnalysis";
import ProductRecommendationEnhanced from "../portfolio/ProductRecommendationEnhanced";

// Styled Components for CustomerInfoDisplay
const CustomerInfoContainer = styled.div`
  padding: var(--hana-space-4);
  margin-top: var(--hana-space-6);
  background: #f8f9fa;
  min-height: 100vh;
`;

const NoCustomerContainer = styled.div`
  text-align: center;
  padding: var(--hana-space-8);
  color: var(--hana-gray);
  background: var(--hana-white);
  border-radius: var(--hana-radius-lg);
  margin: var(--hana-space-4);
  border: var(--hana-border-light);
`;

const NoCustomerIcon = styled.div`
  font-size: 3rem;
  margin-bottom: var(--hana-space-4);
`;

const NoCustomerTitle = styled.h3`
  color: var(--hana-primary);
  margin-bottom: var(--hana-space-2);
  font-size: var(--hana-font-size-xl);
`;

const NoCustomerText = styled.p`
  color: var(--hana-gray);
`;

const CustomerHeader = styled.div`
  background: white;
  color: #333;
  padding: var(--hana-space-5);
  border-radius: 16px;
  margin-bottom: var(--hana-space-6);
  box-shadow: 0 4px 20px rgba(0, 132, 133, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #008485;
`;

const HeaderDecoration1 = styled.div`
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  z-index: 0;
`;

const HeaderDecoration2 = styled.div`
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  z-index: 0;
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--hana-space-4);
`;

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CustomerAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  backdrop-filter: blur(10px);
`;

const CustomerDetails = styled.div``;

const CustomerName = styled.h2`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
  color: #008485;
`;

const CustomerSubInfo = styled.p`
  margin: 0;
  opacity: 0.8;
  font-size: 20px;
  line-height: 1.5;
  letter-spacing: 0px;
  color: #666;
`;

const CustomerContact = styled.div`
  margin-top: 6px;
  font-size: 14px;
  color: #475569;
`;

const ContactRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
`;

const ContactLabel = styled.span`
  min-width: 56px;
  font-weight: 600;
  color: #0f172a;
`;

const ContactValue = styled.span`
  color: #334155;
`;

const AssetGrade = styled.div`
  background: #008485;
  border-radius: 12px;
  padding: var(--hana-space-3);
  text-align: center;
  border: 2px solid #008485;
  color: white;
`;

const SalaryBadge = styled.div`
  margin-top: 8px;
  font-size: 12px;
  background: rgba(0, 132, 133, 0.08);
  color: #008485;
  border: 1px solid #008485;
  padding: 4px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const AssetIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 4px;
`;

const AssetLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  opacity: 0.9;
`;

const AssetAmount = styled.div`
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
`;

const HeaderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hana-space-4);
`;

const InfoItem = styled.p`
  margin: 0.5rem 0;
  opacity: 0.9;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hana-space-5);
  margin-bottom: var(--hana-space-5);
  margin-top: var(--hana-space-2);
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: var(--hana-space-4);
  }
`;

const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--hana-space-4);
  min-height: 600px;
`;

const ProductsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: var(--hana-space-5);
  margin-bottom: var(--hana-space-5);
  margin-top: var(--hana-space-2);
  box-shadow: 0 4px 20px rgba(0, 132, 133, 0.08);
  border: 2px solid #008485;
`;

const ProductsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--hana-space-4);
`;

const ProductsIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #008485;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
`;

const ProductsTitle = styled.h3`
  margin: 0;
  color: #008485;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.3px;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: var(--hana-space-4);
  color: var(--hana-gray);
`;

const LoadingIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: var(--hana-space-2);
`;

const ProductsGrid = styled.div`
  display: grid;
  gap: var(--hana-space-2);
`;

const ProductCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  padding: var(--hana-space-3);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
`;

const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--hana-space-2);
`;

const ProductName = styled.h4`
  margin: 0;
  color: var(--hana-primary);
  font-size: var(--hana-font-size-base);
  font-weight: 700;
`;

const ProductStatus = styled.span`
  background: ${(props) =>
    props.status === "active" ? "var(--hana-success)" : "var(--hana-orange)"};
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: var(--hana-radius-full);
  font-size: 10px;
  font-weight: 700;
`;

const ProductDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hana-space-2);
  font-size: 12px;
  color: var(--hana-gray);
`;

const NoProductsContainer = styled.div`
  text-align: center;
  padding: var(--hana-space-4);
  color: var(--hana-gray);
`;

const NoProductsIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: var(--hana-space-2);
`;

const NoProductsText = styled.p`
  font-size: 14px;
`;

const ShowMoreButton = styled.button`
  background: var(--hana-mint);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  width: 100%;
  position: relative;
  overflow: hidden;

  &:hover {
    background: var(--hana-mint-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const ShowLessButton = styled(ShowMoreButton)`
  background: var(--hana-gray);

  &:hover {
    background: var(--hana-dark-gray);
    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
  }
`;

const ProductCount = styled.div`
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: var(--hana-gray);
  font-weight: 500;
`;

const TabletButtonContainer = styled.div`
  margin-top: var(--hana-space-4);
  text-align: center;
  padding: var(--hana-space-4);
  border-top: 1px solid #eee;
`;

const TabletButton = styled.button`
  background: linear-gradient(135deg, var(--hana-primary), var(--hana-mint));
  color: white;
  border: none;
  border-radius: var(--hana-radius-md);
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--hana-shadow-light);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--hana-shadow-medium);
  }
`;

// Main Component
const CustomerInfoDisplay = ({
  customer,
  detailed = false,
  onSendToTablet,
  customerProducts = [],
  loadingProducts = false,
  onSelectProduct,
}) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const PRODUCTS_PER_PAGE = 5;

  if (!customer) {
    return (
      <NoCustomerContainer>
        <NoCustomerIcon>👤</NoCustomerIcon>
        <NoCustomerTitle>고객 정보 없음</NoCustomerTitle>
        <NoCustomerText>
          신분증을 업로드하거나 테스트 고객을 선택해주세요.
        </NoCustomerText>
      </NoCustomerContainer>
    );
  }

  // 디버깅 로그 (문제 해결용)
  console.log("CustomerInfoDisplay - customer:", customer);
  console.log("CustomerInfoDisplay - detailed:", detailed);
  console.log("CustomerInfoDisplay - customerProducts:", customerProducts);
  console.log("CustomerInfoDisplay - customer.products:", customer?.products);
  console.log("CustomerInfoDisplay - loadingProducts:", loadingProducts);

  // 헬퍼: 연락처/주소/급여통장 여부 안전 추출
  const getContact = (c) =>
    c.ContactNumber ||
    c.contactnumber ||
    c.contactNumber ||
    c.Phone ||
    c.phone ||
    c.mobile ||
    c.tel ||
    "-";
  const getAddress = (c) =>
    c.Address || c.address || c.address_line || c.addressLine || c.addr || "-";
  const hasSalaryAccount = (c) =>
    c.SalaryAccount === true ||
    c.salaryaccount === true ||
    c.salary_account === true;

  return (
    <CustomerInfoContainer>
      {/* 고객 기본 정보 헤더 */}
      <CustomerHeader>
        <HeaderDecoration1 />
        <HeaderDecoration2 />
        <HeaderContent>
          <HeaderTop>
            <CustomerInfo>
              <CustomerAvatar>
                {customer.Name?.charAt(0) || customer.name?.charAt(0) || "👤"}
              </CustomerAvatar>
              <CustomerDetails>
                <CustomerName>
                  {customer.Name || customer.name} 고객님
                </CustomerName>
                <CustomerSubInfo>
                  {customer.CustomerID || customer.customer_id} •{" "}
                  {customer.Age || customer.age}세 •{" "}
                  {customer.Gender || customer.gender === "남" ? "👨" : "👩"}
                </CustomerSubInfo>
                {/* 연락처/주소 */}
                <CustomerContact>
                  <ContactRow>
                    <ContactLabel>연락처</ContactLabel>
                    <ContactValue>{getContact(customer)}</ContactValue>
                  </ContactRow>
                  <ContactRow>
                    <ContactLabel>주소</ContactLabel>
                    <ContactValue>{getAddress(customer)}</ContactValue>
                  </ContactRow>
                </CustomerContact>
              </CustomerDetails>
            </CustomerInfo>

            {/* 자산 등급 표시 */}
            <AssetGrade>
              <AssetIcon>
                {(() => {
                  const totalAssets = customer.productSummary?.totalAssets || 0;
                  if (totalAssets >= 100000000) return "👑";
                  if (totalAssets >= 50000000) return "🥇";
                  if (totalAssets >= 20000000) return "🥈";
                  if (totalAssets >= 5000000) return "🥉";
                  return "⭐";
                })()}
              </AssetIcon>
              <AssetLabel>
                {(() => {
                  const totalAssets = customer.productSummary?.totalAssets || 0;
                  if (totalAssets >= 100000000) return "VIP";
                  if (totalAssets >= 50000000) return "Gold";
                  if (totalAssets >= 20000000) return "Silver";
                  if (totalAssets >= 5000000) return "Bronze";
                  return "Standard";
                })()}
              </AssetLabel>
              <AssetAmount>
                {(customer.productSummary?.totalAssets || 0).toLocaleString()}원
              </AssetAmount>
              {(() => {
                const hasSalary =
                  customer.SalaryAccount === true ||
                  customer.salaryaccount === true ||
                  customer.salary_account === true;
                return hasSalary ? (
                  <SalaryBadge>💳 급여통장 사용</SalaryBadge>
                ) : null;
              })()}
            </AssetGrade>
          </HeaderTop>

          <HeaderGrid>
            <div>
              <InfoItem>
                <strong>📞 연락처:</strong> {getContact(customer)}
              </InfoItem>
              <InfoItem>
                <strong>🏠 주소:</strong> {getAddress(customer)}
              </InfoItem>
            </div>
            <div>
              <InfoItem>
                <strong>🆔 고객 ID:</strong>{" "}
                {customer.CustomerID || customer.customer_id}
              </InfoItem>
              <InfoItem>
                <strong>💳 급여통장:</strong>{" "}
                {hasSalaryAccount(customer) ? "보유" : "없음"}
              </InfoItem>
            </div>
          </HeaderGrid>
        </HeaderContent>
      </CustomerHeader>

      {/* 좌우 2열 레이아웃 */}
      <DashboardGrid>
        {/* 왼쪽 컬럼 - 포트폴리오 분석 */}
        <GridSection>
          <PortfolioAnalysis
            customerProducts={customerProducts}
            totalAssets={customer.productSummary?.totalAssets || 0}
          />
        </GridSection>

        {/* 오른쪽 컬럼 - 맞춤 상품 추천 */}
        <GridSection>
          <ProductRecommendationEnhanced
            customer={customer}
            customerProducts={customerProducts}
            onSelectProduct={(product) => {
              console.log("🎯 CustomerInfoDisplay - 상품 선택됨:", product);
              console.log(
                "🎯 CustomerInfoDisplay - onSendToTablet:",
                onSendToTablet
              );
              console.log("🎯 CustomerInfoDisplay - 전송할 데이터:", {
                type: "product-description",
                data: product,
              });

              if (onSendToTablet) {
                onSendToTablet({ type: "product-description", data: product });
                console.log("✅ CustomerInfoDisplay - 태블릿으로 전송 완료");
              } else {
                console.error(
                  "❌ CustomerInfoDisplay - onSendToTablet이 없습니다!"
                );
              }
            }}
          />
        </GridSection>
      </DashboardGrid>

      {/* 가입 상품 정보 */}
      {detailed && (
        <ProductsSection>
          <ProductsHeader>
            <ProductsIcon>📋</ProductsIcon>
            <ProductsTitle>가입 상품 정보</ProductsTitle>
          </ProductsHeader>

          <div>
            {loadingProducts ? (
              <LoadingContainer>
                <LoadingIcon>⏳</LoadingIcon>
                <p>상품 정보를 불러오는 중...</p>
              </LoadingContainer>
            ) : (Array.isArray(customerProducts) &&
                customerProducts.length > 0) ||
              (Array.isArray(customer?.products) &&
                customer.products.length > 0) ? (
              <>
                <ProductsGrid>
                  {(Array.isArray(customerProducts)
                    ? customerProducts
                    : Array.isArray(customer.products)
                    ? customer.products
                    : []
                  )
                    .slice(0, showAllProducts ? undefined : PRODUCTS_PER_PAGE)
                    .map((product, index) => (
                      <ProductCard key={index}>
                        <ProductHeader>
                          <ProductName>
                            {product.productName ||
                              product.product_name ||
                              "상품명 없음"}
                          </ProductName>
                          <ProductStatus status={product.status}>
                            {product.status === "active" ? "활성" : "비활성"}
                          </ProductStatus>
                        </ProductHeader>

                        <ProductDetails>
                          <div>
                            <strong>잔액:</strong>{" "}
                            {(product.balance || 0).toLocaleString()}원
                          </div>
                          <div>
                            <strong>금리:</strong> {product.interestRate || 0}%
                          </div>
                          <div>
                            <strong>가입일:</strong>{" "}
                            {product.startDate ||
                              product.enrollmentDate ||
                              "N/A"}
                          </div>
                          <div>
                            <strong>만료일:</strong>{" "}
                            {product.maturityDate || "N/A"}
                          </div>
                        </ProductDetails>
                      </ProductCard>
                    ))}
                </ProductsGrid>

                {/* 상품 개수 표시 */}
                <ProductCount>
                  {showAllProducts
                    ? `전체 ${
                        (Array.isArray(customerProducts)
                          ? customerProducts
                          : customer?.products || []
                        ).length
                      }개 상품`
                    : `${PRODUCTS_PER_PAGE}개 / 전체 ${
                        (Array.isArray(customerProducts)
                          ? customerProducts
                          : customer?.products || []
                        ).length
                      }개 상품`}
                </ProductCount>

                {/* 더보기/접기 버튼 */}
                {(Array.isArray(customerProducts)
                  ? customerProducts
                  : customer?.products || []
                ).length > PRODUCTS_PER_PAGE &&
                  (showAllProducts ? (
                    <ShowLessButton onClick={() => setShowAllProducts(false)}>
                      📋 상품 목록 접기
                    </ShowLessButton>
                  ) : (
                    <ShowMoreButton onClick={() => setShowAllProducts(true)}>
                      📋 더 많은 상품 보기 (
                      {(Array.isArray(customerProducts)
                        ? customerProducts
                        : customer?.products || []
                      ).length - PRODUCTS_PER_PAGE}
                      개 더)
                    </ShowMoreButton>
                  ))}
              </>
            ) : (
              <NoProductsContainer>
                <NoProductsIcon>📋</NoProductsIcon>
                <NoProductsText>가입된 상품이 없습니다.</NoProductsText>
              </NoProductsContainer>
            )}
          </div>
        </ProductsSection>
      )}

      {/* 태블릿에 보여주기 버튼 */}
      {detailed && onSendToTablet && (
        <TabletButtonContainer>
          <TabletButton onClick={() => onSendToTablet(customer)}>
            📱 태블릿에 보여주기
          </TabletButton>
        </TabletButtonContainer>
      )}
    </CustomerInfoContainer>
  );
};

export default CustomerInfoDisplay;
