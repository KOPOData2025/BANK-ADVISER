import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";
import { getApiUrl } from "../../config/api";

// Styled Components
import {
  CustomerContainer,
  WelcomeCard,
  WelcomeTitle,
  WelcomeSubtitle,
  ContentCard,
  ContentHeader,
  ContentTitle,
  ContentSubtitle,
  ContentBody,
  ProductGrid,
  ProductCard,
  ProductName,
  ProductDescription,
  ProductDetails,
  ProductRate,
  SimulationResult,
  ResultGrid,
  ResultItem,
  ResultLabel,
  ResultValue,
  SignatureSection,
  SignatureTitle,
  SignatureCanvasContainer,
  SignatureButtons,
  Button,
  LoadingOverlay,
  LoadingCard,
  StatusBadge,
} from "./CustomerInterface.styles";

const formatRate = (rate) => {
  return rate ? rate.toFixed(2) + "%" : "0.00%";
};

const CustomerInterface = () => {
  const { sessionId } = useParams();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [screenData, setScreenData] = useState(null);
  const [loading, setLoading] = useState(false);

  const signatureRef = useRef();

  useEffect(() => {
    // Socket.IO 연결
    const newSocket = io();
    setSocket(newSocket);

    // 세션 참여
    newSocket.emit("join-session", {
      sessionId,
      userType: "customer",
      userId: "customer",
    });

    // 이벤트 리스너 설정
    newSocket.on("session-joined", () => {
      setConnected(true);
    });

    newSocket.on("screen-updated", (data) => {
      setScreenData(data);
      setCurrentScreen(data.type);
    });

    newSocket.on("simulation-updated", (data) => {
      setScreenData(data);
      setCurrentScreen("simulation");
    });

    return () => newSocket.close();
  }, [sessionId]);

  const handleSignature = async () => {
    if (!signatureRef.current.isEmpty()) {
      setLoading(true);

      try {
        const signatureData = signatureRef.current.toDataURL();

        await axios.post(getApiUrl("/api/signature/submit"), {
          customerId: screenData?.customerId,
          sessionId: sessionId,
          productId: screenData?.product?.ProductID,
          signatureData: signatureData,
        });

        setCurrentScreen("completion");
      } catch (error) {
        console.error("서명 처리 오류:", error);
        alert("서명 처리 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearSignature = () => {
    signatureRef.current.clear();
  };

  const renderWelcomeScreen = () => (
    <div>
      <WelcomeCard>
        <WelcomeTitle>하나은행에 오신 것을 환영합니다!</WelcomeTitle>
        <WelcomeSubtitle>
          전문 상담사가 고객님께 최적의 금융 솔루션을 제안해드리겠습니다.
        </WelcomeSubtitle>
      </WelcomeCard>

      <ContentCard>
        <ContentHeader>
          <ContentTitle>상담 준비 중</ContentTitle>
          <ContentSubtitle>잠시만 기다려주세요...</ContentSubtitle>
        </ContentHeader>
        <ContentBody>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <StatusBadge className={connected ? "connected" : "waiting"}>
              {connected ? "✓ 상담사와 연결됨" : "⏳ 연결 대기 중"}
            </StatusBadge>
            <p>상담사가 고객님의 신분증을 확인하고 있습니다.</p>
          </div>
        </ContentBody>
      </ContentCard>
    </div>
  );

  const renderProductComparison = () => (
    <ContentCard>
      <ContentHeader>
        <ContentTitle>상품 비교</ContentTitle>
        <ContentSubtitle>선택하신 상품들을 비교해보세요</ContentSubtitle>
      </ContentHeader>
      <ContentBody>
        <ProductGrid>
          {screenData?.data?.map((product, index) => (
            <ProductCard key={index}>
              <ProductName>{product.ProductName}</ProductName>
              <ProductDescription>{product.Description}</ProductDescription>
              <ProductDetails>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--hana-dark-gray)",
                    }}
                  >
                    기본 금리
                  </div>
                  <ProductRate>
                    {formatRate(product.BaseInterestRate)}
                  </ProductRate>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--hana-dark-gray)",
                    }}
                  >
                    상품 유형
                  </div>
                  <div style={{ fontWeight: "600" }}>{product.ProductType}</div>
                </div>
              </ProductDetails>
            </ProductCard>
          ))}
        </ProductGrid>
      </ContentBody>
    </ContentCard>
  );

  const renderSimulationResult = () => (
    <div>
      <ContentCard>
        <ContentHeader>
          <ContentTitle>혜택 시뮬레이션 결과</ContentTitle>
          <ContentSubtitle>
            {screenData?.data?.product?.ProductName}
          </ContentSubtitle>
        </ContentHeader>
        <ContentBody>
          <SimulationResult>
            <ResultGrid>
              <ResultItem>
                <ResultLabel>기본 금리</ResultLabel>
                <ResultValue>
                  {formatRate(screenData?.data?.result?.baseInterestRate)}
                </ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>최종 금리</ResultLabel>
                <ResultValue>
                  {formatRate(screenData?.data?.result?.totalInterestRate)}
                </ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>우대 혜택</ResultLabel>
                <ResultValue>
                  +
                  {formatRate(
                    (screenData?.data?.result?.totalInterestRate || 0) -
                      (screenData?.data?.result?.baseInterestRate || 0)
                  )}
                </ResultValue>
              </ResultItem>
            </ResultGrid>

            <div style={{ textAlign: "center" }}>
              <h4 style={{ marginBottom: "1rem" }}>🎉 축하합니다!</h4>
              <p>고객님의 조건으로 최대 우대혜택을 받으실 수 있습니다.</p>
            </div>
          </SimulationResult>
        </ContentBody>
      </ContentCard>
    </div>
  );

  const renderApplicationForm = () => (
    <ContentCard>
      <ContentHeader>
        <ContentTitle>🎉 상품 가입 신청</ContentTitle>
        <ContentSubtitle>
          {screenData?.data?.product?.ProductName || "선택된 상품"}
        </ContentSubtitle>
      </ContentHeader>
      <ContentBody>
        {/* 상품 정보 요약 */}
        <div
          style={{
            marginBottom: "2rem",
            background:
              "linear-gradient(135deg, var(--hana-primary-light), var(--hana-mint-light))",
            padding: "2rem",
            borderRadius: "var(--hana-radius-xl)",
            border: "2px solid var(--hana-primary)",
          }}
        >
          <h3
            style={{
              color: "var(--hana-primary)",
              marginBottom: "1.5rem",
              fontSize: "var(--hana-font-size-xl)",
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            📋 가입 정보 확인
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                background: "var(--hana-white)",
                padding: "1.5rem",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-primary)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  color: "var(--hana-gray)",
                  marginBottom: "0.5rem",
                }}
              >
                최종 금리
              </div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-xl)",
                  fontWeight: "700",
                  color: "var(--hana-primary)",
                }}
              >
                {formatRate(screenData?.data?.simulation?.totalInterestRate) ||
                  "4.90%"}
              </div>
            </div>

            <div
              style={{
                background: "var(--hana-white)",
                padding: "1.5rem",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-primary)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎁</div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  color: "var(--hana-gray)",
                  marginBottom: "0.5rem",
                }}
              >
                적용 혜택
              </div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-xl)",
                  fontWeight: "700",
                  color: "var(--hana-primary)",
                }}
              >
                {screenData?.data?.simulation?.benefits?.length || 0}개
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--hana-white)",
              padding: "1.5rem",
              borderRadius: "var(--hana-radius-lg)",
              border: "2px solid var(--hana-primary)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💵</div>
            <div
              style={{
                fontSize: "var(--hana-font-size-sm)",
                color: "var(--hana-gray)",
                marginBottom: "0.5rem",
              }}
            >
              예상 수익
            </div>
            <div
              style={{
                fontSize: "var(--hana-font-size-xl)",
                fontWeight: "700",
                color: "var(--hana-primary)",
              }}
            >
              {screenData?.data?.simulation?.expectedAmount || "12,294,000원"}
            </div>
          </div>
        </div>

        {/* 서명 섹션 */}
        <SignatureSection>
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✍️</div>
            <SignatureTitle>전자 서명</SignatureTitle>
            <p
              style={{
                marginBottom: "1rem",
                color: "var(--hana-gray)",
                fontSize: "var(--hana-font-size-lg)",
              }}
            >
              아래 서명란에 서명해주세요
            </p>
            <p
              style={{
                color: "var(--hana-gray)",
                fontSize: "var(--hana-font-size-sm)",
              }}
            >
              서명은 법적 효력을 가지며, 상품 가입을 위한 필수 절차입니다
            </p>
          </div>

          <SignatureCanvasContainer
            style={{
              border: "3px dashed var(--hana-primary)",
              borderRadius: "var(--hana-radius-lg)",
              background: "var(--hana-primary-light)",
              padding: "1rem",
            }}
          >
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 500,
                height: 250,
                className: "signature-canvas",
                style: {
                  border: "2px solid var(--hana-primary)",
                  borderRadius: "var(--hana-radius-md)",
                  background: "var(--hana-white)",
                },
              }}
            />
          </SignatureCanvasContainer>

          <SignatureButtons
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <Button
              className="secondary"
              onClick={clearSignature}
              style={{
                padding: "var(--hana-space-4) var(--hana-space-6)",
                fontSize: "var(--hana-font-size-lg)",
                fontWeight: "600",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-light-gray)",
                background: "var(--hana-white)",
                color: "var(--hana-gray)",
              }}
            >
              🔄 다시 작성
            </Button>
            <Button
              className="primary"
              onClick={handleSignature}
              style={{
                padding: "var(--hana-space-4) var(--hana-space-6)",
                fontSize: "var(--hana-font-size-lg)",
                fontWeight: "600",
                borderRadius: "var(--hana-radius-lg)",
                background:
                  "linear-gradient(135deg, var(--hana-primary), var(--hana-mint))",
                color: "var(--hana-white)",
                border: "none",
                boxShadow: "var(--hana-shadow-medium)",
              }}
            >
              ✅ 가입 완료
            </Button>
          </SignatureButtons>
        </SignatureSection>
      </ContentBody>
    </ContentCard>
  );

  const renderCompletionScreen = () => (
    <ContentCard>
      <ContentHeader>
        <ContentTitle>🎉 가입 완료!</ContentTitle>
        <ContentSubtitle>상품 가입이 성공적으로 완료되었습니다</ContentSubtitle>
      </ContentHeader>
      <ContentBody>
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background:
              "linear-gradient(135deg, var(--hana-success-light), var(--hana-primary-light))",
            borderRadius: "var(--hana-radius-xl)",
            border: "3px solid var(--hana-success)",
          }}
        >
          <div
            style={{
              fontSize: "6rem",
              marginBottom: "2rem",
              animation: "bounce 2s infinite",
            }}
          >
            🎉
          </div>

          <h3
            style={{
              color: "var(--hana-success)",
              marginBottom: "1.5rem",
              fontSize: "var(--hana-font-size-2xl)",
              fontWeight: "700",
            }}
          >
            가입 신청이 완료되었습니다!
          </h3>

          <div
            style={{
              background: "var(--hana-white)",
              padding: "2rem",
              borderRadius: "var(--hana-radius-lg)",
              border: "2px solid var(--hana-success)",
              marginBottom: "2rem",
              maxWidth: "500px",
              margin: "0 auto 2rem auto",
            }}
          >
            <p
              style={{
                color: "var(--hana-gray)",
                fontSize: "var(--hana-font-size-lg)",
                marginBottom: "1rem",
                fontWeight: "500",
              }}
            >
              📋 처리 안내
            </p>
            <p
              style={{
                color: "var(--hana-dark-gray)",
                fontSize: "var(--hana-font-size-base)",
                lineHeight: 1.6,
              }}
            >
              영업일 기준 1-2일 내에 처리 결과를 안내드리겠습니다.
              <br />
              가입 승인 시 계좌 개설 및 상품 가입이 완료됩니다.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                background: "var(--hana-white)",
                padding: "1.5rem",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-primary)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📧</div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  color: "var(--hana-gray)",
                  marginBottom: "0.5rem",
                }}
              >
                이메일 안내
              </div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  fontWeight: "600",
                  color: "var(--hana-primary)",
                }}
              >
                처리 결과 발송
              </div>
            </div>

            <div
              style={{
                background: "var(--hana-white)",
                padding: "1.5rem",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-primary)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📱</div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  color: "var(--hana-gray)",
                  marginBottom: "0.5rem",
                }}
              >
                SMS 알림
              </div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  fontWeight: "600",
                  color: "var(--hana-primary)",
                }}
              >
                승인 완료 통지
              </div>
            </div>

            <div
              style={{
                background: "var(--hana-white)",
                padding: "1.5rem",
                borderRadius: "var(--hana-radius-lg)",
                border: "2px solid var(--hana-primary)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏦</div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  color: "var(--hana-gray)",
                  marginBottom: "0.5rem",
                }}
              >
                계좌 개설
              </div>
              <div
                style={{
                  fontSize: "var(--hana-font-size-sm)",
                  fontWeight: "600",
                  color: "var(--hana-primary)",
                }}
              >
                자동 처리
              </div>
            </div>
          </div>
        </div>
      </ContentBody>
    </ContentCard>
  );

  return (
    <CustomerContainer>
      {currentScreen === "welcome" && renderWelcomeScreen()}
      {currentScreen === "product-comparison-updated" &&
        renderProductComparison()}
      {currentScreen === "simulation-result" && renderSimulationResult()}
      {currentScreen === "show-application-form" && renderApplicationForm()}
      {currentScreen === "completion" && renderCompletionScreen()}

      {loading && (
        <LoadingOverlay>
          <LoadingCard>
            <div className="spinner"></div>
            <h3 style={{ marginTop: "1rem" }}>처리 중...</h3>
            <p>잠시만 기다려주세요</p>
          </LoadingCard>
        </LoadingOverlay>
      )}
    </CustomerContainer>
  );
};

export default CustomerInterface;
