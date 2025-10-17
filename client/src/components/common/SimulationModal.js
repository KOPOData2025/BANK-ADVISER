import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SimulationModal = ({ isOpen, onClose, data = {} }) => {
  console.log("📊 [SimulationModal] 렌더링:", { isOpen, data });
  console.log(
    "📊 [SimulationModal] 데이터 상세:",
    JSON.stringify(data, null, 2)
  );

  if (!isOpen) return null;

  const simulationData = data ? data.data || data : {};
  console.log("📊 [SimulationModal] 시뮬레이션 데이터:", simulationData);

  // 기본 데이터 설정
  const defaultData = {
    title: "혜택 시뮬레이션",
    productInfo: {
      productName: "하나은행 정기예금",
      productType: "예금",
      basicRate: 3.5,
      maxRate: 4.2,
      description: "안정적인 수익을 원하는 고객을 위한 상품",
      period: 12,
    },
    results: {
      monthlyPayment: 300000,
      totalDeposit: 3600000,
      expectedInterest: 126000,
      finalAmount: 3726000,
    },
    preferentialRates: [
      {
        icon: "🏦",
        name: "신규고객 우대",
        description: "신규 고객 대상 우대금리",
        rate: 0.3,
        color: "#00c73c",
      },
      {
        icon: "💰",
        name: "대용량 우대",
        description: "1천만원 이상 가입 시",
        rate: 0.2,
        color: "#2196F3",
      },
    ],
  };

  // 데이터가 없거나 비어있으면 기본 데이터 사용
  const finalData = (() => {
    if (Object.keys(simulationData).length > 0) {
      // 실제 시뮬레이션 데이터가 있는 경우
      const productInfo =
        simulationData.selectedProduct || simulationData.productInfo;
      const results = simulationData.simulationResult || simulationData.results;
      const preferentialRates =
        simulationData.selectedConditions || simulationData.preferentialRates;

      console.log("📊 [SimulationModal] 실제 데이터 파싱:", {
        productInfo,
        results,
        preferentialRates,
      });

      return {
        title: simulationData.title || "혜택 시뮬레이션",
        productInfo: productInfo
          ? {
              productName: productInfo.productName || productInfo.ProductName,
              productType: productInfo.productType || productInfo.ProductType,
              basicRate: productInfo.basicRate || productInfo.BasicRate || 3.5,
              maxRate: productInfo.maxRate || productInfo.MaxRate || 4.2,
              description:
                productInfo.description ||
                productInfo.Description ||
                "안정적인 수익을 원하는 고객을 위한 상품",
              period: productInfo.period || productInfo.Period || 12,
            }
          : defaultData.productInfo,
        results: results
          ? {
              // 시뮬레이션 결과에서 실제 데이터 추출
              baseInterestRate: results.baseInterestRate || 3.5,
              totalInterestRate: results.totalInterestRate || 4.2,
              monthlyPayment: 300000, // 기본값
              totalDeposit: 3600000, // 기본값
              expectedInterest: results.expectedInterest || 126000,
              finalAmount: results.finalAmount || 3726000,
              benefits: results.benefits || [],
            }
          : defaultData.results,
        preferentialRates: preferentialRates
          ? preferentialRates.map((condition) => ({
              icon: "🏦",
              name: condition.ConditionName || condition.name,
              description: condition.Description || condition.description,
              rate: condition.Rate || condition.rate || 0.3,
              color: condition.Color || condition.color || "#00c73c",
            }))
          : defaultData.preferentialRates,
      };
    }
    return defaultData;
  })();

  // 차트 데이터 생성 함수
  const generateChartData = () => {
    if (!finalData.results) return [];

    const monthlyPayment = finalData.results.monthlyPayment || 300000;
    const period = finalData.productInfo?.period || 12;
    const rate =
      finalData.results.totalInterestRate ||
      finalData.productInfo?.basicRate ||
      3.5;

    const chartData = [];
    let cumulativeAmount = 0;
    let cumulativeInterest = 0;

    for (let month = 1; month <= period; month++) {
      cumulativeAmount += monthlyPayment;
      const monthlyInterest = cumulativeAmount * (rate / 100 / 12);
      cumulativeInterest += monthlyInterest;

      chartData.push({
        month: `${month}개월`,
        납입원금: Math.round(cumulativeAmount),
        누적이자: Math.round(cumulativeInterest),
        총액: Math.round(cumulativeAmount + cumulativeInterest),
      });
    }

    return chartData;
  };

  const chartData = generateChartData();

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ margin: 0, color: "#333", fontSize: "2rem" }}>
            💰 {finalData.title || "혜택 시뮬레이션"}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              background: "white",
              cursor: "pointer",
              color: "#666",
              fontSize: "1rem",
            }}
          >
            ✕ 닫기
          </button>
        </div>

        {finalData.productInfo && (
          <div
            style={{
              border: "2px solid #00c73c",
              borderRadius: "15px",
              padding: "1.5rem",
              marginBottom: "2rem",
              backgroundColor: "#f8fff8",
            }}
          >
            <h3
              style={{
                color: "#00c73c",
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              📊 상품 정보
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <strong>상품명:</strong> {finalData.productInfo.productName}
              </div>
              <div>
                <strong>상품유형:</strong> {finalData.productInfo.productType}
              </div>
              <div>
                <strong>기본금리:</strong> {finalData.productInfo.basicRate}%
              </div>
              <div>
                <strong>최고금리:</strong> {finalData.productInfo.maxRate}%
              </div>
            </div>
            <p style={{ marginTop: "1rem", color: "#666" }}>
              {finalData.productInfo.description}
            </p>
          </div>
        )}

        {finalData.results && (
          <div
            style={{
              border: "2px solid #2196F3",
              borderRadius: "15px",
              padding: "1.5rem",
              marginBottom: "2rem",
              backgroundColor: "#f3f8ff",
            }}
          >
            <h3
              style={{
                color: "#2196F3",
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              💵 시뮬레이션 결과
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <strong>기본 금리:</strong>{" "}
                {finalData.results.baseInterestRate?.toFixed(2)}%
              </div>
              <div>
                <strong>최종 금리:</strong>{" "}
                {finalData.results.totalInterestRate?.toFixed(2)}%
              </div>
              <div>
                <strong>우대 금리:</strong>{" "}
                {(
                  (finalData.results.totalInterestRate || 0) -
                  (finalData.results.baseInterestRate || 0)
                ).toFixed(2)}
                %
              </div>
              <div>
                <strong>예상 이자:</strong>{" "}
                {finalData.results.expectedInterest?.toLocaleString()}원
              </div>
            </div>

            {/* 적용된 혜택 표시 */}
            {finalData.results.benefits &&
              finalData.results.benefits.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h4 style={{ color: "#2196F3", marginBottom: "0.5rem" }}>
                    적용된 혜택
                  </h4>
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    {finalData.results.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "bold" }}>
                          {benefit.BenefitName}
                        </span>
                        <span style={{ color: "#00c73c", fontWeight: "bold" }}>
                          {benefit.BenefitType === "Interest Rate" &&
                            `+${benefit.ApplicableValue}%`}
                          {benefit.BenefitType === "Fee Discount" &&
                            "수수료 면제"}
                          {benefit.BenefitType === "Points" &&
                            `${benefit.ApplicableValue}P`}
                          {benefit.BenefitType === "Cashback" &&
                            `${benefit.ApplicableValue}% 캐시백`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {finalData.preferentialRates &&
          finalData.preferentialRates.length > 0 && (
            <div
              style={{
                border: "2px solid #FF9800",
                borderRadius: "15px",
                padding: "1.5rem",
                marginBottom: "2rem",
                backgroundColor: "#fff8f0",
              }}
            >
              <h3
                style={{
                  color: "#FF9800",
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                }}
              >
                🎯 우대금리 조건
              </h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                {finalData.preferentialRates.map((rate, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      backgroundColor: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{rate.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                        {rate.name}
                      </div>
                      <div style={{ color: "#666", fontSize: "0.9rem" }}>
                        {rate.description}
                      </div>
                    </div>
                    <div
                      style={{
                        color: rate.color,
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      +{rate.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 수익 시각화 차트 */}
        {chartData.length > 0 && (
          <div
            style={{
              border: "2px solid #9C27B0",
              borderRadius: "15px",
              padding: "1.5rem",
              marginBottom: "2rem",
              backgroundColor: "#f9f3fb",
            }}
          >
            <h3
              style={{
                color: "#9C27B0",
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              📈 수익 시각화
            </h3>

            <div style={{ height: "300px", marginBottom: "1rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${(value / 10000).toFixed(0)}만원`
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()}원`,
                      name,
                    ]}
                    labelFormatter={(label) => `기간: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="납입원금"
                    stroke="#2196F3"
                    strokeWidth={3}
                    dot={{ fill: "#2196F3", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="누적이자"
                    stroke="#00c73c"
                    strokeWidth={3}
                    dot={{ fill: "#00c73c", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="총액"
                    stroke="#FF9800"
                    strokeWidth={4}
                    dot={{ fill: "#FF9800", strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                marginTop: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "3px",
                    backgroundColor: "#2196F3",
                  }}
                ></div>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                  납입원금
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "3px",
                    backgroundColor: "#00c73c",
                  }}
                ></div>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                  누적이자
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "4px",
                    backgroundColor: "#FF9800",
                  }}
                ></div>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                  총 수령액
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "2rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "1rem 2rem",
              border: "1px solid #ccc",
              borderRadius: "10px",
              background: "white",
              cursor: "pointer",
              color: "#666",
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;
