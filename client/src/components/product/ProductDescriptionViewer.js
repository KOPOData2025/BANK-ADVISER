import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ProductDescriptionViewer = ({
  product,
  onClose,
  onNext,
  stompClient,
  sessionId,
  highlights: externalHighlights = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(80);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlights, setHighlights] = useState([]);

  // PDF URL 생성 - 상품별 설명서 또는 기본 PDF
  const getPdfUrl = (pageNumber) => {
    // 상품에 설명서 정보가 있으면 해당 경로 사용
    if (
      product?.documentInfo?.hasDocument &&
      product.documentInfo.documentPath
    ) {
      console.log("📄 상품별 설명서 사용:", product.documentInfo.documentPath);
      return product.documentInfo.documentPath;
    }

    // 기본 PDF (1부터 80까지)
    console.log("📄 기본 PDF 사용:", pageNumber);
    return `/api/documents/product-pdf/${pageNumber}`;
  };

  // 컴포넌트 마운트 시 로딩 상태 해제
  useEffect(() => {
    // PDF 존재 확인 없이 바로 로딩 해제
    setLoading(false);
    setError(null);
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageInput = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 하이라이트 기능 - 직접 밑줄 그리기
  const handleMouseDown = (e) => {
    console.log("🖱️ 마우스 다운 이벤트:", {
      highlightMode,
      isDrawing,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
    });
    if (!highlightMode) {
      console.log("❌ 하이라이트 모드가 비활성화됨");
      return;
    }

    console.log("✅ 하이라이트 모드 활성화, 드로잉 시작");
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const newHighlight = {
      id: Date.now(),
      startX,
      startY,
      endX: startX,
      endY: startY,
      color: highlightColor,
      page: currentPage,
    };

    console.log("🖍️ 새 하이라이트 생성:", newHighlight);
    setHighlights((prev) => {
      const updated = [...prev, newHighlight];
      console.log("📝 하이라이트 배열 업데이트:", updated);
      return updated;
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !highlightMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    setHighlights((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          endX,
          endY,
        };
        console.log(
          "🖱️ 마우스 이동으로 하이라이트 업데이트:",
          updated[updated.length - 1]
        );
      }
      return updated;
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    console.log("🖱️ 마우스 업 이벤트, 드로잉 완료");
    setIsDrawing(false);

    // 하이라이트 완료 시 태블릿에 동기화
    if (stompClient && sessionId && stompClient.active) {
      // 최신 하이라이트 상태를 가져오기 위해 함수형 업데이트 사용
      setHighlights((prevHighlights) => {
        const lastHighlight = prevHighlights[prevHighlights.length - 1];
        if (lastHighlight) {
          console.log("📤 태블릿에 하이라이트 동기화 전송:", lastHighlight);
          stompClient.publish({
            destination: "/app/screen-highlight",
            body: JSON.stringify({
              sessionId: sessionId,
              data: {
                highlight: lastHighlight,
                color: highlightColor,
                page: currentPage,
                elementId: lastHighlight.elementId || null,
                highlightType: lastHighlight.highlightType || "highlight",
              },
              timestamp: new Date().toISOString(),
            }),
          });
        }
        return prevHighlights;
      });
    }
  };

  // 페이지 변경 시 태블릿 동기화
  const syncPageToTablet = (pageNumber) => {
    if (stompClient && sessionId && stompClient.active) {
      console.log(
        `[PC] 상품설명서 페이지 동기화 메시지 전송: sessionId=${sessionId}, page=${pageNumber}`
      );
      stompClient.publish({
        destination: "/app/product-description",
        body: JSON.stringify({
          sessionId: sessionId,
          product: product,
          currentPage: pageNumber,
          totalPages: totalPages,
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      console.warn(
        "[PC] STOMP 클라이언트가 활성화되지 않아 페이지 동기화 메시지를 보낼 수 없습니다."
      );
    }
  };

  // 페이지 변경 시 태블릿 동기화 호출 (하이라이트와 분리)
  useEffect(() => {
    if (currentPage > 0) {
      syncPageToTablet(currentPage);
    }
  }, [currentPage, product, totalPages, stompClient, sessionId]);

  if (loading) {
    return (
      <ModalOverlay>
        <ModalContent>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📄</div>
            <p>상품설명서를 불러오는 중...</p>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay>
        <ModalContent>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>❌</div>
            <p>{error}</p>
            <button
              onClick={onClose}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            >
              닫기
            </button>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <ModalContent>
        {/* 헤더 */}
        <Header>
          <div>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.8rem",
                fontWeight: "700",
              }}
            >
              📋 {product?.productName || product?.product_name || "상품"}{" "}
              상품설명서
            </h2>
            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              💡 고객과 함께 상품 내용을 확인하고 중요한 부분을 하이라이트하세요
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {/* 하이라이트 도구 */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                padding: "0.5rem",
                background: "rgba(255,255,255,0.8)",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
              }}
            >
              <button
                onClick={() => {
                  console.log("🖍️ 하이라이트 모드 토글:", {
                    current: highlightMode,
                    new: !highlightMode,
                  });
                  setHighlightMode(!highlightMode);
                }}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: highlightMode
                    ? "linear-gradient(45deg, #ff6b6b, #ee5a52)"
                    : "linear-gradient(45deg, #4ecdc4, #44a08d)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                }}
              >
                {highlightMode ? "🖍️ 하이라이트 끄기" : "🖍️ 하이라이트"}
              </button>

              {highlightMode && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    padding: "0.5rem",
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#666",
                      fontWeight: "500",
                      marginRight: "0.25rem",
                    }}
                  >
                    색상:
                  </span>
                  {[
                    { color: "#ffff00", name: "노랑", emoji: "🟡" },
                    { color: "#ff6b6b", name: "빨강", emoji: "🔴" },
                    { color: "#4ecdc4", name: "청록", emoji: "🟢" },
                    { color: "#45b7d1", name: "파랑", emoji: "🔵" },
                  ].map((colorOption) => (
                    <button
                      key={colorOption.color}
                      onClick={() => setHighlightColor(colorOption.color)}
                      style={{
                        width: "36px",
                        height: "36px",
                        background: colorOption.color,
                        border:
                          highlightColor === colorOption.color
                            ? "3px solid #333"
                            : "2px solid #ddd",
                        borderRadius: "50%",
                        cursor: "pointer",
                        title: colorOption.name,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        transition: "all 0.2s ease",
                        boxShadow:
                          highlightColor === colorOption.color
                            ? "0 2px 8px rgba(0,0,0,0.3)"
                            : "0 1px 4px rgba(0,0,0,0.1)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = "scale(1.1)";
                        e.target.style.boxShadow = "0 3px 10px rgba(0,0,0,0.2)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow =
                          highlightColor === colorOption.color
                            ? "0 2px 8px rgba(0,0,0,0.3)"
                            : "0 1px 4px rgba(0,0,0,0.1)";
                      }}
                    >
                      {colorOption.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                console.log("❌ PC 상품설명서 닫기 버튼 클릭");
                console.log("🔍 STOMP 상태:", {
                  stompClient: !!stompClient,
                  active: stompClient?.active,
                  sessionId,
                });

                // 태블릿에 상품설명서 닫기 알림
                if (stompClient && sessionId && stompClient.active) {
                  console.log("📤 태블릿에 상품설명서 닫기 메시지 전송");
                  stompClient.publish({
                    destination: "/app/product-description-close",
                    body: JSON.stringify({
                      sessionId: sessionId,
                      timestamp: new Date().toISOString(),
                    }),
                  });
                } else {
                  console.log(
                    "❌ STOMP 클라이언트가 비활성화되어 태블릿 동기화 불가"
                  );
                }
                onClose();
              }}
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(45deg, #ff6b6b, #ee5a52)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.1) rotate(90deg)";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1) rotate(0deg)";
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              }}
            >
              ✕
            </button>
          </div>
        </Header>

        {/* PDF 뷰어 */}
        <PdfContainer>
          <PdfFrame
            src={`${getPdfUrl(
              currentPage
            )}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&scrollbar=1&view=FitH&pagemode=none&disableworker=true`}
            title={`상품설명서 ${currentPage}페이지`}
            onLoad={() => setLoading(false)}
            onError={() => setError("PDF를 불러올 수 없습니다.")}
          />

          {/* 하이라이트 모드일 때 마우스 이벤트를 캐치하는 오버레이 */}
          {highlightMode && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                cursor: "crosshair",
                zIndex: 5,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}

          {/* 하이라이트 렌더링 */}
          {(() => {
            // 중복 제거를 위해 Map 사용
            const highlightMap = new Map();

            // 내부 highlights 추가
            highlights.forEach((highlight) => {
              highlightMap.set(highlight.id, highlight);
            });

            // 외부 highlights 추가 (중복 ID는 덮어쓰기)
            externalHighlights.forEach((highlight) => {
              highlightMap.set(highlight.id, highlight);
            });

            const allHighlights = Array.from(highlightMap.values());

            return allHighlights
              .filter((highlight) => highlight.page === currentPage)
              .map((highlight) => {
                console.log("🎨 하이라이트 렌더링:", highlight);
                return (
                  <div
                    key={highlight.id}
                    style={{
                      position: "absolute",
                      left: Math.min(highlight.startX, highlight.endX),
                      top: Math.min(highlight.startY, highlight.endY),
                      width: Math.abs(highlight.endX - highlight.startX),
                      height: Math.abs(highlight.endY - highlight.startY),
                      backgroundColor: highlight.color,
                      opacity: 0.3,
                      pointerEvents: "none",
                      zIndex: 15,
                    }}
                  />
                );
              });
          })()}

          {/* 하이라이트 오버레이 */}
          {highlightMode && (
            <HighlightOverlay>
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  background: "rgba(0,0,0,0.8)",
                  color: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>
                  🖍️ 하이라이트 모드
                </p>
                <p style={{ margin: "0", fontSize: "0.8rem" }}>
                  마우스로 드래그하여 직접 밑줄을 그으세요
                </p>
              </div>

              {/* 하이라이트 지우기 버튼만 유지 */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                }}
              >
                <button
                  onClick={() => {
                    console.log("🗑️ 하이라이트 지우기 버튼 클릭");
                    setHighlights([]);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  🗑️ 지우기
                </button>
              </div>
            </HighlightOverlay>
          )}
        </PdfContainer>

        {/* 페이지 네비게이션 */}
        <Navigation>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="nav-btn"
            >
              ◀ 이전
            </button>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>페이지:</span>
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                min="1"
                max={totalPages}
                style={{
                  width: "60px",
                  padding: "0.25rem",
                  textAlign: "center",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <span>/ {totalPages}</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="nav-btn"
            >
              다음 ▶
            </button>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={onClose} className="secondary-btn">
              닫기
            </button>
            <button
              onClick={() => {
                console.log("📊 PC 시뮬레이션 보기 버튼 클릭");

                // 태블릿에 시뮬레이션 동기화
                if (stompClient && sessionId && stompClient.active) {
                  console.log("📤 태블릿에 시뮬레이션 동기화 전송");
                  stompClient.publish({
                    destination: "/app/product-simulation",
                    body: JSON.stringify({
                      sessionId: sessionId,
                      data: {
                        product: product,
                        currentPage: currentPage,
                        action: "show_simulation",
                      },
                      timestamp: new Date().toISOString(),
                    }),
                  });
                } else {
                  console.log(
                    "❌ STOMP 클라이언트가 비활성화되어 태블릿 동기화 불가"
                  );
                }

                onNext();
              }}
              className="primary-btn"
            >
              📊 시뮬레이션 보기
            </button>
          </div>
        </Navigation>
      </ModalContent>
    </ModalOverlay>
  );
};

// 스타일드 컴포넌트
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 98%;
  max-width: 1600px;
  height: 98vh;
  max-height: 1200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  background: linear-gradient(
    135deg,
    var(--hana-primary) 0%,
    var(--hana-mint) 100%
  );
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  p {
    margin: 0.5rem 0 0 0;
    opacity: 0.9;
    font-size: 0.9rem;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const PdfContainer = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  min-height: 800px;
  position: relative;
`;

const HighlightOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;

  button {
    pointer-events: auto;
  }
`;

const PdfFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Navigation = styled.div`
  padding: 1rem 2rem;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e9ecef;

  .nav-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--hana-primary);
    background: white;
    color: var(--hana-primary);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--hana-primary);
      color: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .primary-btn {
    padding: 0.75rem 1.5rem;
    background: var(--hana-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s ease;

    &:hover {
      background: var(--hana-mint);
    }
  }

  .secondary-btn {
    padding: 0.75rem 1.5rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s ease;

    &:hover {
      background: #5a6268;
    }
  }
`;

export default ProductDescriptionViewer;
