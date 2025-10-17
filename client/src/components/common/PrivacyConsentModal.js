import React from "react";

const PrivacyConsentModal = ({ isOpen, onClose, onAgree, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "2rem",
          width: "calc(100vw - 40px)",
          height: "calc(100vh - 40px)",
          maxWidth: "none",
          maxHeight: "none",
          overflowY: "auto",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              marginBottom: "1rem",
              color: "#333",
              fontSize: "2.5rem",
              fontWeight: "bold",
            }}
          >
            {data.title}
          </h2>
          <p style={{ color: "#666", fontSize: "1.5rem" }}>{data.content}</p>
        </div>

        {/* 메인 컨텐츠 - 2열 레이아웃 */}
        <div
          style={{
            display: "flex",
            gap: "3rem",
            height: "calc(100% - 200px)",
          }}
        >
          {/* 왼쪽: 동의 내용 */}
          <div style={{ flex: "2", overflowY: "auto" }}>
            <h3
              style={{
                color: "#00c73c",
                marginBottom: "1.5rem",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              🎤 음성 녹음 및 상담 분석을 위한 개인정보 수집·이용 동의
            </h3>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  color: "#333",
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                1. 수집·이용 목적
              </h4>
              <ul
                style={{
                  color: "#666",
                  paddingLeft: "2rem",
                  lineHeight: "1.8",
                  fontSize: "1.2rem",
                }}
              >
                <li>고객 상담 품질 향상 및 서비스 개선</li>
                <li>음성 인식을 통한 상담 내용 자동 기록</li>
                <li>AI 기반 맞춤형 상품 추천 서비스 제공</li>
                <li>상담 이력 관리 및 후속 서비스 제공</li>
              </ul>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  color: "#333",
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                2. 수집·이용 항목
              </h4>
              <ul
                style={{
                  color: "#666",
                  paddingLeft: "2rem",
                  lineHeight: "1.8",
                  fontSize: "1.2rem",
                }}
              >
                <li>음성 녹음 데이터 (상담 중 음성)</li>
                <li>상담 내용 텍스트 (STT 변환 결과)</li>
                <li>고객 기본 정보 (이름, 고객번호)</li>
                <li>상담 일시 및 상담원 정보</li>
              </ul>
            </div>

            <div
              style={{
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                padding: "1.5rem",
                marginTop: "1rem",
              }}
            >
              <h4
                style={{
                  color: "#856404",
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                3. 보유·이용 기간
              </h4>
              <p
                style={{
                  color: "#856404",
                  margin: 0,
                  fontSize: "1.2rem",
                  lineHeight: "1.8",
                }}
              >
                ※ 동의 거부 시: 음성 녹음 및 AI 기반 상담 서비스를 이용하실 수
                없습니다. 기본 상담 서비스는 정상적으로 이용 가능합니다.
              </p>
            </div>
          </div>

          {/* 오른쪽: 고객 정보 및 동의 버튼 */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "#f8f9fa",
              borderRadius: "15px",
              padding: "2rem",
            }}
          >
            {/* 고객 정보 */}
            <div>
              <h4
                style={{
                  color: "#333",
                  marginBottom: "1.5rem",
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                고객 정보
              </h4>
              {data.fields && (
                <div>
                  {data.fields.map((field, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "1.5rem",
                        color: "#666",
                        fontSize: "1.3rem",
                        background: "white",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <div
                        style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
                      >
                        {field.name}
                      </div>
                      <div>{field.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 동의 버튼 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginTop: "2rem",
              }}
            >
              <button
                onClick={onAgree}
                style={{
                  padding: "1.5rem 2rem",
                  border: "none",
                  borderRadius: "15px",
                  background: "#00c73c",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  boxShadow: "0 4px 15px rgba(0, 199, 60, 0.3)",
                }}
              >
                모두 동의 후 완료
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "1rem 2rem",
                  border: "2px solid #ccc",
                  borderRadius: "15px",
                  background: "white",
                  cursor: "pointer",
                  color: "#666",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                }}
              >
                동의하지 않음
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
