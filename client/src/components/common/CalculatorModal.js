import React, { useState, useEffect } from "react";

const CalculatorModal = ({ isOpen, onClose, data = {}, isTablet = false }) => {
  console.log("🧮 [CalculatorModal] 렌더링:", { isOpen, data, isTablet });

  const [activeTab, setActiveTab] = useState("comparison");

  // 단리/복리 비교 상태
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(2.6);
  const [period, setPeriod] = useState(12);

  // 예금 계산기 상태
  const [depositAmount, setDepositAmount] = useState(1000000);
  const [depositRate, setDepositRate] = useState(2.6);
  const [depositPeriod, setDepositPeriod] = useState(12);

  // 적금 계산기 상태
  const [installmentAmount, setInstallmentAmount] = useState(1000000);
  const [installmentRate, setInstallmentRate] = useState(2.6);
  const [installmentPeriod, setInstallmentPeriod] = useState(12);

  const [results, setResults] = useState({
    comparison: {
      simple: { totalAmount: 0, interest: 0, tax: 0, afterTax: 0 },
      compound: { totalAmount: 0, interest: 0, tax: 0, afterTax: 0 },
      difference: 0,
    },
    deposit: {
      totalAmount: 0,
      interest: 0,
      tax: 0,
      afterTax: 0,
    },
    installment: {
      totalAmount: 0,
      interest: 0,
      tax: 0,
      afterTax: 0,
    },
  });

  useEffect(() => {
    console.log("🧮 [CalculatorModal] 데이터 동기화:", data);
    if (data) {
      // 단리/복리 비교 계산기 데이터
      if (data.principal !== undefined) setPrincipal(data.principal);
      if (data.rate !== undefined) setRate(data.rate);
      if (data.period !== undefined) setPeriod(data.period);

      // 예금 계산기 데이터
      if (data.depositAmount !== undefined)
        setDepositAmount(data.depositAmount);
      if (data.depositRate !== undefined) setDepositRate(data.depositRate);
      if (data.depositPeriod !== undefined)
        setDepositPeriod(data.depositPeriod);

      // 적금 계산기 데이터
      if (data.installmentAmount !== undefined)
        setInstallmentAmount(data.installmentAmount);
      if (data.installmentRate !== undefined)
        setInstallmentRate(data.installmentRate);
      if (data.installmentPeriod !== undefined)
        setInstallmentPeriod(data.installmentPeriod);

      // 활성 탭 동기화
      if (data.activeTab) setActiveTab(data.activeTab);

      console.log("✅ [CalculatorModal] 모든 데이터 동기화 완료");
    }
  }, [data]);

  useEffect(() => {
    calculateResults();
  }, [
    principal,
    rate,
    period,
    depositAmount,
    depositRate,
    depositPeriod,
    installmentAmount,
    installmentRate,
    installmentPeriod,
  ]);

  const calculateResults = () => {
    // 단리/복리 비교 계산
    const monthlyRate = rate / 100 / 12;
    const simpleInterest = principal * (rate / 100) * (period / 12);
    const compoundInterest =
      principal * Math.pow(1 + monthlyRate, period) - principal;

    // 예금 계산
    const depositMonthlyRate = depositRate / 100 / 12;
    const depositTotal =
      depositAmount * Math.pow(1 + depositMonthlyRate, depositPeriod);
    const depositInterest = depositTotal - depositAmount;

    // 적금 계산
    const installmentMonthlyRate = installmentRate / 100 / 12;
    let installmentTotal = 0;
    for (let month = 1; month <= installmentPeriod; month++) {
      const monthsRemaining = installmentPeriod - month + 1;
      installmentTotal +=
        installmentAmount *
        Math.pow(1 + installmentMonthlyRate, monthsRemaining);
    }
    const installmentInterest =
      installmentTotal - installmentAmount * installmentPeriod;

    // 세금 계산 (이자소득세 15.4%)
    const taxRate = 0.154;
    const simpleTax = simpleInterest * taxRate;
    const compoundTax = compoundInterest * taxRate;
    const depositTax = depositInterest * taxRate;
    const installmentTax = installmentInterest * taxRate;

    setResults({
      comparison: {
        simple: {
          totalAmount: principal + simpleInterest,
          interest: simpleInterest,
          tax: simpleTax,
          afterTax: principal + simpleInterest - simpleTax,
        },
        compound: {
          totalAmount: principal + compoundInterest,
          interest: compoundInterest,
          tax: compoundTax,
          afterTax: principal + compoundInterest - compoundTax,
        },
        difference: compoundInterest - simpleInterest,
      },
      deposit: {
        totalAmount: depositTotal,
        interest: depositInterest,
        tax: depositTax,
        afterTax: depositTotal - depositTax,
      },
      installment: {
        totalAmount: installmentTotal,
        interest: installmentInterest,
        tax: installmentTax,
        afterTax: installmentTotal - installmentTax,
      },
    });
  };

  if (!isOpen) return null;

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
          // 태블릿에서 모달 크기 최대화
          ...(isTablet && {
            width: "calc(100vw - 20px)",
            height: "calc(100vh - 20px)",
          }),
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
            🧮 금리 계산기
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

        {/* 탭 네비게이션 */}
        <div
          style={{
            display: "flex",
            marginBottom: "2rem",
            borderBottom: "2px solid #ddd",
          }}
        >
          <button
            onClick={() => !isTablet && setActiveTab("comparison")}
            disabled={isTablet}
            style={{
              padding: "1rem 2rem",
              border: "none",
              backgroundColor:
                activeTab === "comparison" ? "#2196F3" : "transparent",
              color: activeTab === "comparison" ? "white" : "#666",
              cursor: isTablet ? "not-allowed" : "pointer",
              borderRadius: "10px 10px 0 0",
              fontSize: "1rem",
              fontWeight: "bold",
              opacity: isTablet ? 0.6 : 1,
            }}
          >
            단리 vs 복리 비교
          </button>
          <button
            onClick={() => !isTablet && setActiveTab("deposit")}
            disabled={isTablet}
            style={{
              padding: "1rem 2rem",
              border: "none",
              backgroundColor:
                activeTab === "deposit" ? "#2196F3" : "transparent",
              color: activeTab === "deposit" ? "white" : "#666",
              cursor: isTablet ? "not-allowed" : "pointer",
              borderRadius: "10px 10px 0 0",
              fontSize: "1rem",
              fontWeight: "bold",
              opacity: isTablet ? 0.6 : 1,
            }}
          >
            예금 계산기
          </button>
          <button
            onClick={() => !isTablet && setActiveTab("installment")}
            disabled={isTablet}
            style={{
              padding: "1rem 2rem",
              border: "none",
              backgroundColor:
                activeTab === "installment" ? "#2196F3" : "transparent",
              color: activeTab === "installment" ? "white" : "#666",
              cursor: isTablet ? "not-allowed" : "pointer",
              borderRadius: "10px 10px 0 0",
              fontSize: "1rem",
              fontWeight: "bold",
              opacity: isTablet ? 0.6 : 1,
            }}
          >
            적금 계산기
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
        >
          {/* 입력 섹션 */}
          <div>
            <h3
              style={{
                color: "#2196F3",
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              📝 계산 조건 입력
            </h3>

            {activeTab === "comparison" && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    원금 (원)
                  </label>
                  <input
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    연이율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    기간 (개월)
                  </label>
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === "deposit" && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    예금액 (원)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    연이율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={depositRate}
                    onChange={(e) => setDepositRate(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    기간 (개월)
                  </label>
                  <input
                    type="number"
                    value={depositPeriod}
                    onChange={(e) => setDepositPeriod(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === "installment" && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    월 납입액 (원)
                  </label>
                  <input
                    type="number"
                    value={installmentAmount}
                    onChange={(e) =>
                      setInstallmentAmount(Number(e.target.value))
                    }
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    연이율 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={installmentRate}
                    onChange={(e) => setInstallmentRate(Number(e.target.value))}
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    기간 (개월)
                  </label>
                  <input
                    type="number"
                    value={installmentPeriod}
                    onChange={(e) =>
                      setInstallmentPeriod(Number(e.target.value))
                    }
                    disabled={isTablet}
                    style={{
                      width: "100%",
                      padding: "0.8rem",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isTablet ? "#f5f5f5" : "white",
                      cursor: isTablet ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* 결과 섹션 */}
          <div>
            <h3
              style={{
                color: "#00c73c",
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              💰 계산 결과
            </h3>

            {activeTab === "comparison" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #00c73c",
                    borderRadius: "10px",
                    backgroundColor: "#f8fff8",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    단리 수령액
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#00c73c",
                    }}
                  >
                    {Math.round(
                      results.comparison.simple.totalAmount
                    ).toLocaleString()}
                    원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    이자:{" "}
                    {Math.round(
                      results.comparison.simple.interest
                    ).toLocaleString()}
                    원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                    세금(15.4%):{" "}
                    {Math.round(results.comparison.simple.tax).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#00c73c", fontWeight: "bold" }}>
                    세후 수령액:{" "}
                    {Math.round(results.comparison.simple.afterTax).toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #2196F3",
                    borderRadius: "10px",
                    backgroundColor: "#f3f8ff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    복리 수령액
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {Math.round(
                      results.comparison.compound.totalAmount
                    ).toLocaleString()}
                    원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    이자:{" "}
                    {Math.round(
                      results.comparison.compound.interest
                    ).toLocaleString()}
                    원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                    세금(15.4%):{" "}
                    {Math.round(results.comparison.compound.tax).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#00c73c", fontWeight: "bold" }}>
                    세후 수령액:{" "}
                    {Math.round(results.comparison.compound.afterTax).toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #FF9800",
                    borderRadius: "10px",
                    backgroundColor: "#fff8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    복리 우위
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#FF9800",
                    }}
                  >
                    +
                    {Math.round(results.comparison.difference).toLocaleString()}
                    원
                  </div>
                </div>
              </div>
            )}

            {activeTab === "deposit" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #00c73c",
                    borderRadius: "10px",
                    backgroundColor: "#f8fff8",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    원금
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#666",
                    }}
                  >
                    {depositAmount.toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #2196F3",
                    borderRadius: "10px",
                    backgroundColor: "#f3f8ff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    이자
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {Math.round(results.deposit.interest).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                    세금(15.4%):{" "}
                    {Math.round(results.deposit.tax).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#00c73c", fontWeight: "bold" }}>
                    세후 수령액:{" "}
                    {Math.round(results.deposit.afterTax).toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #FF9800",
                    borderRadius: "10px",
                    backgroundColor: "#fff8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    총 수령액
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#FF9800",
                    }}
                  >
                    {Math.round(results.deposit.totalAmount).toLocaleString()}원
                  </div>
                </div>
              </div>
            )}

            {activeTab === "installment" && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #00c73c",
                    borderRadius: "10px",
                    backgroundColor: "#f8fff8",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    총 납입액
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#666",
                    }}
                  >
                    {(installmentAmount * installmentPeriod).toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #2196F3",
                    borderRadius: "10px",
                    backgroundColor: "#f3f8ff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    이자
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {Math.round(results.installment.interest).toLocaleString()}
                    원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                    세금(15.4%):{" "}
                    {Math.round(results.installment.tax).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#00c73c", fontWeight: "bold" }}>
                    세후 수령액:{" "}
                    {Math.round(results.installment.afterTax).toLocaleString()}원
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    border: "2px solid #FF9800",
                    borderRadius: "10px",
                    backgroundColor: "#fff8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "0.3rem",
                    }}
                  >
                    총 수령액
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      color: "#FF9800",
                    }}
                  >
                    {Math.round(
                      results.installment.totalAmount
                    ).toLocaleString()}
                    원
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

export default CalculatorModal;
