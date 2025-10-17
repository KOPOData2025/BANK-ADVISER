import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  text-align: center;
  position: relative;
`;

const ModalTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const TabContainer = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const Tab = styled.button`
  flex: 1;
  padding: 16px 24px;
  background: ${(props) => (props.active ? "#ffffff" : "transparent")};
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.active ? "#667eea" : "#6c757d")};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid
    ${(props) => (props.active ? "#667eea" : "transparent")};

  &:hover {
    background: ${(props) => (props.active ? "#ffffff" : "#f1f3f4")};
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 600px;
`;

const LeftPanel = styled.div`
  padding: 32px;
  background: #ffffff;
  border-right: 1px solid #e9ecef;
`;

const RightPanel = styled.div`
  padding: 32px;
  background: #f8f9fa;
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
`;

const PanelDescription = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  margin-bottom: 24px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  transition: all 0.2s ease;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const Unit = styled.span`
  position: absolute;
  right: 16px;
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const QuickButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const QuickButton = styled.button`
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
  }
`;

const CalculateButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ResultTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
`;

const TaxInfo = styled.p`
  font-size: 12px;
  color: #6c757d;
  margin: 0 0 24px 0;
`;

const ResultSummary = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
`;

const SummaryText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  margin: 0;
`;

const Highlight = styled.strong`
  color: #667eea;
  font-weight: 700;
`;

const TaxSection = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e9ecef;
`;

const TaxTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
`;

const TaxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaxItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.color || "#667eea"};
`;

const TaxLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
`;

const TaxValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
`;

const InterestCalculator = ({
  isOpen,
  onClose,
  onSyncToClient,
  readOnly = false,
  calculatorData = null,
}) => {
  const [activeTab, setActiveTab] = useState("comparison"); // "comparison", "loan", "deposit", "installment"

  // 대출 계산기 상태
  const [loanAmount, setLoanAmount] = useState(100000000);
  const [loanRate, setLoanRate] = useState(3.2);
  const [loanPeriod, setLoanPeriod] = useState(10);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [repaymentMethod, setRepaymentMethod] = useState("equal");

  // 예금 계산기 상태
  const [depositAmount, setDepositAmount] = useState(300000);
  const [depositRate, setDepositRate] = useState(3.5);
  const [depositPeriod, setDepositPeriod] = useState(12);
  const [depositType, setDepositType] = useState("compound");

  // 적금 계산기 상태
  const [installmentAmount, setInstallmentAmount] = useState(300000);
  const [installmentRate, setInstallmentRate] = useState(3.5);
  const [installmentPeriod, setInstallmentPeriod] = useState(12);
  const [installmentType, setInstallmentType] = useState("compound");

  // 단리/복리 비교 계산기 상태
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(3.5);
  const [period, setPeriod] = useState(12);

  const [results, setResults] = useState({
    comparison: {
      simple: { totalAmount: 0, interest: 0 },
      compound: { totalAmount: 0, interest: 0 },
      difference: 0,
    },
    loan: {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
    },
    deposit: {
      totalAmount: 0,
      interest: 0,
    },
    installment: {
      totalAmount: 0,
      interest: 0,
    },
  });

  // 계산기 상태 동기화 함수
  const syncToClient = (updatedData) => {
    if (onSyncToClient && !readOnly) {
      onSyncToClient({
        activeTab,
        principal,
        rate,
        period,
        loanAmount,
        loanRate,
        loanPeriod,
        depositAmount,
        depositRate,
        installmentAmount,
        installmentRate,
        installmentPeriod,
        results,
        ...updatedData,
      });
    }
  };

  // 외부 데이터가 변경될 때 내부 상태 업데이트 (readOnly 모드)
  useEffect(() => {
    if (readOnly && calculatorData) {
      setActiveTab(calculatorData.activeTab || "comparison");
      setPrincipal(calculatorData.principal || 1000000);
      setRate(calculatorData.rate || 3.5);
      setPeriod(calculatorData.period || 12);
      setLoanAmount(calculatorData.loanAmount || 100000000);
      setLoanRate(calculatorData.loanRate || 3.2);
      setLoanPeriod(calculatorData.loanPeriod || 12);
      setDepositAmount(calculatorData.depositAmount || 1000000);
      setDepositRate(calculatorData.depositRate || 3.5);
      setInstallmentAmount(calculatorData.installmentAmount || 100000);
      setInstallmentRate(calculatorData.installmentRate || 3.5);
      setInstallmentPeriod(calculatorData.installmentPeriod || 12);
      if (calculatorData.results) {
        setResults(calculatorData.results);
      }
    }
  }, [readOnly, calculatorData]);

  // 음성 명령으로 값 설정
  useEffect(() => {
    if (isOpen) {
      const handleVoiceCommand = (event) => {
        const { command, value } = event.detail;

        switch (command) {
          case "set_principal":
            if (activeTab === "comparison") {
              setPrincipal(Number(value));
            } else if (activeTab === "loan") {
              setLoanAmount(Number(value));
            } else if (activeTab === "deposit") {
              setDepositAmount(Number(value));
            } else if (activeTab === "installment") {
              setInstallmentAmount(Number(value));
            }
            break;
          case "set_rate":
            if (activeTab === "comparison") {
              setRate(Number(value));
            } else if (activeTab === "loan") {
              setLoanRate(Number(value));
            } else if (activeTab === "deposit") {
              setDepositRate(Number(value));
            } else if (activeTab === "installment") {
              setInstallmentRate(Number(value));
            }
            break;
          case "set_period":
            if (activeTab === "comparison") {
              setPeriod(Number(value));
            } else if (activeTab === "loan") {
              setLoanPeriod(Number(value));
            } else if (activeTab === "deposit") {
              setDepositPeriod(Number(value));
            } else if (activeTab === "installment") {
              setInstallmentPeriod(Number(value));
            }
            break;
          case "set_type":
            if (activeTab === "deposit") {
              setDepositType(value);
            } else if (activeTab === "installment") {
              setInstallmentType(value);
            }
            break;
          case "set_tab":
            setActiveTab(value);
            break;
          case "calculate":
            calculateResults();
            break;
          default:
            break;
        }
      };

      window.addEventListener("calculatorVoiceCommand", handleVoiceCommand);

      return () => {
        window.removeEventListener(
          "calculatorVoiceCommand",
          handleVoiceCommand
        );
      };
    }
  }, [isOpen, activeTab]);

  // 비교 계산 함수
  const calculateComparison = () => {
    const p = principal;
    const r = rate / 100;
    const t = period / 12; // 개월을 년으로 변환

    // 단리 계산
    const simpleInterest = p * r * t;
    const simpleTotal = p + simpleInterest;

    // 복리 계산
    const compoundTotal = p * Math.pow(1 + r, t);
    const compoundInterest = compoundTotal - p;

    // 차이 계산
    const difference = compoundInterest - simpleInterest;

    return {
      simple: {
        totalAmount: simpleTotal,
        interest: simpleInterest,
      },
      compound: {
        totalAmount: compoundTotal,
        interest: compoundInterest,
      },
      difference: difference,
    };
  };

  // 대출 계산 함수
  const calculateLoan = () => {
    const principal = loanAmount;
    const monthlyRate = loanRate / 100 / 12;
    const totalMonths = loanPeriod * 12;
    const graceMonths = gracePeriod * 12;

    let monthlyPayment = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (repaymentMethod === "equal") {
      // 원리금균등상환
      if (graceMonths > 0) {
        // 거치기간이 있는 경우
        const interestDuringGrace = principal * monthlyRate * graceMonths;
        const remainingMonths = totalMonths - graceMonths;
        monthlyPayment =
          (principal *
            monthlyRate *
            Math.pow(1 + monthlyRate, remainingMonths)) /
          (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        totalPayment = interestDuringGrace + monthlyPayment * remainingMonths;
        totalInterest = totalPayment - principal;
      } else {
        // 거치기간이 없는 경우
        monthlyPayment =
          (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1);
        totalPayment = monthlyPayment * totalMonths;
        totalInterest = totalPayment - principal;
      }
    } else if (repaymentMethod === "principal") {
      // 원금균등상환
      const monthlyPrincipal = principal / totalMonths;
      let remainingPrincipal = principal;
      let totalInterestSum = 0;

      for (let i = 0; i < totalMonths; i++) {
        if (i < graceMonths) {
          // 거치기간
          totalInterestSum += remainingPrincipal * monthlyRate;
        } else {
          // 상환기간
          const interest = remainingPrincipal * monthlyRate;
          totalInterestSum += interest;
          remainingPrincipal -= monthlyPrincipal;
        }
      }

      monthlyPayment = monthlyPrincipal + principal * monthlyRate;
      totalPayment = principal + totalInterestSum;
      totalInterest = totalInterestSum;
    }

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  };

  // 예금 계산 함수
  const calculateDeposit = () => {
    const principal = depositAmount;
    const rate = depositRate / 100;
    const years = depositPeriod / 12;

    let totalAmount = 0;
    let interest = 0;

    if (depositType === "simple") {
      // 단리
      interest = principal * rate * years;
      totalAmount = principal + interest;
    } else {
      // 복리
      totalAmount = principal * Math.pow(1 + rate, years);
      interest = totalAmount - principal;
    }

    return {
      totalAmount,
      interest,
    };
  };

  // 적금 계산 함수
  const calculateInstallment = () => {
    const monthlyAmount = installmentAmount;
    const rate = installmentRate / 100;
    const months = installmentPeriod;
    const monthlyRate = rate / 12;

    let totalAmount = 0;
    let interest = 0;

    if (installmentType === "simple") {
      // 단리
      const totalDeposit = monthlyAmount * months;
      const averagePeriod = (months + 1) / 2;
      interest = totalDeposit * (rate / 12) * averagePeriod;
      totalAmount = totalDeposit + interest;
    } else {
      // 복리
      totalAmount =
        monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      const totalDeposit = monthlyAmount * months;
      interest = totalAmount - totalDeposit;
    }

    return {
      totalAmount,
      interest,
    };
  };

  // 계산 실행
  const calculateResults = () => {
    const comparisonResults = calculateComparison();
    const loanResults = calculateLoan();
    const depositResults = calculateDeposit();
    const installmentResults = calculateInstallment();

    const newResults = {
      comparison: comparisonResults,
      loan: loanResults,
      deposit: depositResults,
      installment: installmentResults,
    };

    setResults(newResults);

    // 계산 결과를 태블릿에 동기화
    syncToClient({ results: newResults });
  };

  useEffect(() => {
    calculateResults();
  }, [
    activeTab,
    principal,
    rate,
    period,
    loanAmount,
    loanRate,
    loanPeriod,
    gracePeriod,
    repaymentMethod,
    depositAmount,
    depositRate,
    depositPeriod,
    depositType,
    installmentAmount,
    installmentRate,
    installmentPeriod,
    installmentType,
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(value));
  };

  const formatRate = (value) => {
    return `${value}%`;
  };

  // 세율별 이자 계산
  const calculateTaxedInterest = (interest, taxRate) => {
    const tax = interest * (taxRate / 100);
    return interest - tax;
  };

  const getTaxRates = () => [
    { label: "일반 세율", rate: 15.4, color: "#dc3545" },
    { label: "세금우대", rate: 9.5, color: "#fd7e14" },
    { label: "비과세", rate: 0.0, color: "#28a745" },
  ];

  // 비교 계산기 렌더링
  const renderComparisonCalculator = () => (
    <>
      <PanelTitle>단리 vs 복리 비교 계산기</PanelTitle>
      <PanelDescription>
        같은 조건에서 단리와 복리의 차이를 비교해보세요.
      </PanelDescription>

      <InputGroup>
        <Label>원금</Label>
        <InputContainer>
          <Input
            type="number"
            value={principal}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setPrincipal(newValue);
              syncToClient({ principal: newValue });
            }}
            placeholder="1000000"
            disabled={readOnly}
          />
          <Unit>원</Unit>
        </InputContainer>
        {!readOnly && (
          <QuickButtonContainer>
            <QuickButton onClick={() => setPrincipal(0)}>초기화</QuickButton>
            <QuickButton onClick={() => setPrincipal(1000000)}>
              100만
            </QuickButton>
            <QuickButton onClick={() => setPrincipal(5000000)}>
              500만
            </QuickButton>
            <QuickButton onClick={() => setPrincipal(10000000)}>
              1000만
            </QuickButton>
          </QuickButtonContainer>
        )}
      </InputGroup>

      <InputGroup>
        <Label>연 이자율</Label>
        <InputContainer>
          <Input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setRate(newValue);
              syncToClient({ rate: newValue });
            }}
            placeholder="3.5"
            disabled={readOnly}
          />
          <Unit>%</Unit>
        </InputContainer>
        {!readOnly && (
          <QuickButtonContainer>
            <QuickButton onClick={() => setRate(0)}>초기화</QuickButton>
            <QuickButton onClick={() => setRate(2.0)}>2%</QuickButton>
            <QuickButton onClick={() => setRate(3.0)}>3%</QuickButton>
            <QuickButton onClick={() => setRate(5.0)}>5%</QuickButton>
          </QuickButtonContainer>
        )}
      </InputGroup>

      <InputGroup>
        <Label>기간</Label>
        <InputContainer>
          <Input
            type="number"
            value={period}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setPeriod(newValue);
              syncToClient({ period: newValue });
            }}
            placeholder="12"
            disabled={readOnly}
          />
          <Unit>개월</Unit>
        </InputContainer>
        {!readOnly && (
          <QuickButtonContainer>
            <QuickButton onClick={() => setPeriod(0)}>초기화</QuickButton>
            <QuickButton onClick={() => setPeriod(6)}>6개월</QuickButton>
            <QuickButton onClick={() => setPeriod(12)}>12개월</QuickButton>
            <QuickButton onClick={() => setPeriod(24)}>24개월</QuickButton>
          </QuickButtonContainer>
        )}
      </InputGroup>
    </>
  );

  // 대출 계산기 렌더링
  const renderLoanCalculator = () => (
    <>
      <PanelTitle>대출 이자 계산기</PanelTitle>
      <PanelDescription>
        매월 얼마씩 갚아야 하지? 원금과 이자가 매월 얼마씩 나가는지, 대출 기간
        동안 총 비용은 어떻게 되는지 계산해 드립니다.
      </PanelDescription>

      <InputGroup>
        <Label>상환방식</Label>
        <Select
          value={repaymentMethod}
          onChange={(e) => setRepaymentMethod(e.target.value)}
        >
          <option value="equal">원리금균등상환</option>
          <option value="principal">원금균등상환</option>
          <option value="interest">원금만기일시상환</option>
        </Select>
      </InputGroup>

      <InputGroup>
        <Label>대출 금액</Label>
        <InputContainer>
          <Input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            placeholder="100000000"
          />
          <Unit>원</Unit>
        </InputContainer>
        <QuickButtonContainer>
          <QuickButton onClick={() => setLoanAmount(0)}>초기화</QuickButton>
          <QuickButton onClick={() => setLoanAmount((prev) => prev + 1000000)}>
            +100만
          </QuickButton>
          <QuickButton onClick={() => setLoanAmount((prev) => prev + 10000000)}>
            +1000만
          </QuickButton>
          <QuickButton
            onClick={() => setLoanAmount((prev) => prev + 100000000)}
          >
            +1억
          </QuickButton>
        </QuickButtonContainer>
      </InputGroup>

      <InputGroup>
        <Label>연 이자율</Label>
        <InputContainer>
          <Input
            type="number"
            step="0.1"
            value={loanRate}
            onChange={(e) => setLoanRate(Number(e.target.value))}
            placeholder="3.2"
          />
          <Unit>%</Unit>
        </InputContainer>
        <QuickButtonContainer>
          <QuickButton onClick={() => setLoanRate(0)}>초기화</QuickButton>
          <QuickButton onClick={() => setLoanRate((prev) => prev + 1)}>
            +1%
          </QuickButton>
          <QuickButton onClick={() => setLoanRate((prev) => prev + 2)}>
            +2%
          </QuickButton>
          <QuickButton onClick={() => setLoanRate((prev) => prev + 5)}>
            +5%
          </QuickButton>
        </QuickButtonContainer>
      </InputGroup>

      <InputGroup>
        <Label>상환기간</Label>
        <InputContainer>
          <Input
            type="number"
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(Number(e.target.value))}
            placeholder="10"
          />
          <Unit>년</Unit>
        </InputContainer>
        <QuickButtonContainer>
          <QuickButton onClick={() => setLoanPeriod(0)}>초기화</QuickButton>
          <QuickButton onClick={() => setLoanPeriod(1)}>1년</QuickButton>
          <QuickButton onClick={() => setLoanPeriod(2)}>2년</QuickButton>
          <QuickButton onClick={() => setLoanPeriod(5)}>5년</QuickButton>
        </QuickButtonContainer>
      </InputGroup>

      <InputGroup>
        <Label>거치기간</Label>
        <InputContainer>
          <Input
            type="number"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(Number(e.target.value))}
            placeholder="0"
          />
          <Unit>년</Unit>
        </InputContainer>
        <QuickButtonContainer>
          <QuickButton onClick={() => setGracePeriod(0)}>초기화</QuickButton>
          <QuickButton onClick={() => setGracePeriod(1)}>1년</QuickButton>
          <QuickButton onClick={() => setGracePeriod(2)}>2년</QuickButton>
          <QuickButton onClick={() => setGracePeriod(5)}>5년</QuickButton>
        </QuickButtonContainer>
      </InputGroup>
    </>
  );

  // 예금 계산기 렌더링
  const renderDepositCalculator = () => (
    <>
      <PanelTitle>예금 계산기</PanelTitle>
      <PanelDescription>
        한번에 금액을 납입하는 예금입니다. 원하시는 계산 방식을 선택해주세요.
      </PanelDescription>

      <InputGroup>
        <Label>최초 납입 금액</Label>
        <InputContainer>
          <Input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            placeholder="300000"
          />
          <Unit>원</Unit>
        </InputContainer>
      </InputGroup>

      <InputGroup>
        <Label>적립 기간</Label>
        <Select
          value={depositPeriod}
          onChange={(e) => setDepositPeriod(Number(e.target.value))}
        >
          <option value={6}>6개월</option>
          <option value={12}>12개월</option>
          <option value={24}>24개월</option>
          <option value={36}>36개월</option>
        </Select>
      </InputGroup>

      <InputGroup>
        <Label>연 이자율</Label>
        <InputContainer>
          <Input
            type="number"
            step="0.1"
            value={depositRate}
            onChange={(e) => setDepositRate(Number(e.target.value))}
            placeholder="3.5"
          />
          <Unit>%</Unit>
        </InputContainer>
      </InputGroup>

      <InputGroup>
        <Label>금리 방식</Label>
        <Select
          value={depositType}
          onChange={(e) => setDepositType(e.target.value)}
        >
          <option value="simple">단리</option>
          <option value="compound">복리</option>
        </Select>
      </InputGroup>
    </>
  );

  // 적금 계산기 렌더링
  const renderInstallmentCalculator = () => (
    <>
      <PanelTitle>적금 계산기</PanelTitle>
      <PanelDescription>
        매월 금액을 모으는 방식의 적금입니다. 원하시는 계산 방식을 선택해주세요.
      </PanelDescription>

      <InputGroup>
        <Label>매월 납입 금액</Label>
        <InputContainer>
          <Input
            type="number"
            value={installmentAmount}
            onChange={(e) => setInstallmentAmount(Number(e.target.value))}
            placeholder="300000"
          />
          <Unit>원</Unit>
        </InputContainer>
      </InputGroup>

      <InputGroup>
        <Label>적립 기간</Label>
        <Select
          value={installmentPeriod}
          onChange={(e) => setInstallmentPeriod(Number(e.target.value))}
        >
          <option value={6}>6개월</option>
          <option value={12}>12개월</option>
          <option value={24}>24개월</option>
          <option value={36}>36개월</option>
        </Select>
      </InputGroup>

      <InputGroup>
        <Label>연 이자율</Label>
        <InputContainer>
          <Input
            type="number"
            step="0.1"
            value={installmentRate}
            onChange={(e) => setInstallmentRate(Number(e.target.value))}
            placeholder="3.5"
          />
          <Unit>%</Unit>
        </InputContainer>
      </InputGroup>

      <InputGroup>
        <Label>금리 방식</Label>
        <Select
          value={installmentType}
          onChange={(e) => setInstallmentType(e.target.value)}
        >
          <option value="simple">단리</option>
          <option value="compound">복리</option>
        </Select>
      </InputGroup>
    </>
  );

  // 결과 렌더링
  const renderResults = () => {
    if (activeTab === "comparison") {
      return (
        <>
          <ResultTitle>단리 vs 복리 비교 결과</ResultTitle>
          <ResultSummary>
            <SummaryText>
              원금 <Highlight>{formatCurrency(principal)}원</Highlight>을{" "}
              <Highlight>{period}개월</Highlight> 동안 연 이율{" "}
              <Highlight>{formatRate(rate)}</Highlight>로 계산했을 때:
            </SummaryText>
          </ResultSummary>

          <TaxSection>
            <TaxTitle>단리 계산 결과</TaxTitle>
            <TaxList>
              <TaxItem color="#007bff">
                <TaxLabel>총 금액</TaxLabel>
                <TaxValue>
                  {formatCurrency(results.comparison.simple.totalAmount)}원
                </TaxValue>
              </TaxItem>
              <TaxItem color="#007bff">
                <TaxLabel>이자</TaxLabel>
                <TaxValue>
                  {formatCurrency(results.comparison.simple.interest)}원
                </TaxValue>
              </TaxItem>
            </TaxList>
          </TaxSection>

          <TaxSection>
            <TaxTitle>복리 계산 결과</TaxTitle>
            <TaxList>
              <TaxItem color="#28a745">
                <TaxLabel>총 금액</TaxLabel>
                <TaxValue>
                  {formatCurrency(results.comparison.compound.totalAmount)}원
                </TaxValue>
              </TaxItem>
              <TaxItem color="#28a745">
                <TaxLabel>이자</TaxLabel>
                <TaxValue>
                  {formatCurrency(results.comparison.compound.interest)}원
                </TaxValue>
              </TaxItem>
            </TaxList>
          </TaxSection>

          <TaxSection>
            <TaxTitle>차이점</TaxTitle>
            <TaxList>
              <TaxItem
                color={
                  results.comparison.difference > 0 ? "#dc3545" : "#6c757d"
                }
              >
                <TaxLabel>복리가 단리보다</TaxLabel>
                <TaxValue>
                  {results.comparison.difference > 0 ? "+" : ""}
                  {formatCurrency(Math.abs(results.comparison.difference))}원
                  {results.comparison.difference > 0 ? " 더 많음" : " 더 적음"}
                </TaxValue>
              </TaxItem>
            </TaxList>
          </TaxSection>
        </>
      );
    } else if (activeTab === "loan") {
      return (
        <>
          <ResultTitle>계산 결과</ResultTitle>
          <ResultSummary>
            <SummaryText>
              <Highlight>{formatCurrency(loanAmount)}원</Highlight>을{" "}
              <Highlight>{loanPeriod}년</Highlight> 동안
              {repaymentMethod === "equal"
                ? "원리금균등상환"
                : repaymentMethod === "principal"
                ? "원금균등상환"
                : "원금만기일시상환"}
              으로 대출을 받았을때 <Highlight>{formatRate(loanRate)}</Highlight>
              기준 매월{" "}
              <Highlight>
                {formatCurrency(results.loan.monthlyPayment)}원
              </Highlight>
              씩 갚아야 합니다.
            </SummaryText>
          </ResultSummary>
        </>
      );
    } else if (activeTab === "deposit") {
      return (
        <>
          <ResultTitle>계산 결과</ResultTitle>
          <TaxInfo>15.4% 세후 기준</TaxInfo>
          <ResultSummary>
            <SummaryText>
              최초 <Highlight>{formatCurrency(depositAmount)}원</Highlight>을{" "}
              <Highlight>{depositPeriod}개월</Highlight>동안 연 이율{" "}
              <Highlight>{formatRate(depositRate)}</Highlight>로 저축하면 총{" "}
              <Highlight>
                {formatCurrency(results.deposit.totalAmount)}원
              </Highlight>
              을 저축하실 수 있습니다.
            </SummaryText>
          </ResultSummary>
          <TaxSection>
            <TaxTitle>세율별 총 이자액</TaxTitle>
            <TaxList>
              {getTaxRates().map((tax) => (
                <TaxItem key={tax.label} color={tax.color}>
                  <TaxLabel>{tax.label}</TaxLabel>
                  <TaxValue>
                    {tax.rate}% →{" "}
                    {formatCurrency(
                      calculateTaxedInterest(results.deposit.interest, tax.rate)
                    )}
                    원
                  </TaxValue>
                </TaxItem>
              ))}
            </TaxList>
          </TaxSection>
        </>
      );
    } else if (activeTab === "installment") {
      return (
        <>
          <ResultTitle>계산 결과</ResultTitle>
          <TaxInfo>15.4% 세후 기준</TaxInfo>
          <ResultSummary>
            <SummaryText>
              매월 <Highlight>{formatCurrency(installmentAmount)}원</Highlight>
              씩 <Highlight>{installmentPeriod}개월</Highlight>동안 연 이율{" "}
              <Highlight>{formatRate(installmentRate)}</Highlight>의{" "}
              <Highlight>
                {installmentType === "simple" ? "단리" : "복리"}
              </Highlight>
              로 저축하면 총{" "}
              <Highlight>
                {formatCurrency(results.installment.totalAmount)}원
              </Highlight>
              을 저축하실 수 있습니다.
            </SummaryText>
          </ResultSummary>
          <TaxSection>
            <TaxTitle>세율별 총 이자액</TaxTitle>
            <TaxList>
              {getTaxRates().map((tax) => (
                <TaxItem key={tax.label} color={tax.color}>
                  <TaxLabel>{tax.label}</TaxLabel>
                  <TaxValue>
                    {tax.rate}% →{" "}
                    {formatCurrency(
                      calculateTaxedInterest(
                        results.installment.interest,
                        tax.rate
                      )
                    )}
                    원
                  </TaxValue>
                </TaxItem>
              ))}
            </TaxList>
          </TaxSection>
        </>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>금융 계산기</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <TabContainer>
          <Tab
            active={activeTab === "comparison"}
            onClick={() => setActiveTab("comparison")}
          >
            단리 vs 복리 비교
          </Tab>
          <Tab
            active={activeTab === "loan"}
            onClick={() => setActiveTab("loan")}
          >
            대출 이자 계산기
          </Tab>
          <Tab
            active={activeTab === "deposit"}
            onClick={() => setActiveTab("deposit")}
          >
            예금 계산기
          </Tab>
          <Tab
            active={activeTab === "installment"}
            onClick={() => setActiveTab("installment")}
          >
            적금 계산기
          </Tab>
        </TabContainer>

        <ContentContainer>
          <LeftPanel>
            {activeTab === "comparison" && renderComparisonCalculator()}
            {activeTab === "loan" && renderLoanCalculator()}
            {activeTab === "deposit" && renderDepositCalculator()}
            {activeTab === "installment" && renderInstallmentCalculator()}

            {!readOnly && (
              <CalculateButton onClick={calculateResults}>
                계산하기
              </CalculateButton>
            )}
          </LeftPanel>

          <RightPanel>{renderResults()}</RightPanel>
        </ContentContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default InterestCalculator;
