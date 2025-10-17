// 하나은행 예금 상품 데이터 (실제 데이터베이스에서 가져온 데이터)
// 시뮬레이션 차트용 실제 상품 데이터

export const depositProductsData = {
  // 기본 정기예금 상품들
  termDeposits: [
    {
      id: 1,
      name: "고단위 플러스(금리확정형)",
      category: "정기예금",
      rateType: "고정금리",
      targetCustomers: "고액고객",
      minAmount: 10000000, // 1천만원
      maxAmount: null,
      minPeriod: 12,
      maxPeriod: 36,
      baseRate: 3.5,
      maxRate: 4.2, // 우대금리 포함
      preferentialConditions: [
        { name: "급여이체", bonus: 0.3 },
        { name: "자동이체", bonus: 0.2 },
        { name: "VIP고객", bonus: 0.25 },
      ],
      description: "고액 예금 상품으로 금리가 확정된 정기예금",
    },
    {
      id: 2,
      name: "고단위 플러스(금리연동형)",
      category: "정기예금",
      rateType: "연동금리",
      targetCustomers: "고액고객",
      minAmount: 10000000,
      maxAmount: null,
      minPeriod: 12,
      maxPeriod: 36,
      baseRate: 3.2,
      maxRate: 3.85,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.25 },
        { name: "자동이체", bonus: 0.15 },
        { name: "온라인가입", bonus: 0.1 },
      ],
      description: "고액 예금 상품으로 금리가 연동되는 정기예금",
    },
    {
      id: 3,
      name: "지수플러스 정기예금",
      category: "정기예금",
      rateType: "지수연동",
      targetCustomers: "일반고객",
      minAmount: 1000000, // 100만원
      maxAmount: null,
      minPeriod: 12,
      maxPeriod: 24,
      baseRate: 2.8,
      maxRate: 3.2,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.2 },
        { name: "온라인가입", bonus: 0.15 },
      ],
      description: "지수에 연동되는 정기예금 상품",
    },
    {
      id: 4,
      name: "3·6·9 정기예금",
      category: "정기예금",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 1000000,
      maxAmount: null,
      minPeriod: 3,
      maxPeriod: 9,
      baseRate: 2.7, // 6개월 기준
      maxRate: 3.15,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.25 },
        { name: "자동이체", bonus: 0.2 },
      ],
      description: "3개월, 6개월, 9개월 기간의 정기예금",
    },
    {
      id: 5,
      name: "하나의 정기예금",
      category: "정기예금",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 1000000,
      maxAmount: null,
      minPeriod: 12,
      maxPeriod: 24,
      baseRate: 2.6,
      maxRate: 3.0,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.2 },
        { name: "신규고객", bonus: 0.15 },
      ],
      description: "하나은행의 기본 정기예금 상품",
    },
    {
      id: 6,
      name: "ISA 정기예금",
      category: "정기예금",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 1000000,
      maxAmount: 20000000, // 2천만원 (ISA 한도)
      minPeriod: 12,
      maxPeriod: 24,
      baseRate: 2.4,
      maxRate: 2.75,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.15 },
        { name: "세제혜택", bonus: 0.1 },
      ],
      description: "개인종합자산관리계좌 정기예금",
    },
  ],

  // 통장 상품들
  accounts: [
    {
      id: 8,
      name: "급여하나 통장",
      category: "통장",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 0,
      maxAmount: null,
      minPeriod: 0,
      maxPeriod: null,
      baseRate: 0.1,
      maxRate: 1.0, // 급여이체 우대 포함
      preferentialConditions: [
        { name: "급여이체", bonus: 0.9 },
        { name: "자동이체", bonus: 0.5 },
        { name: "온라인가입", bonus: 0.1 },
      ],
      description: "급여이체 우대 통장",
    },
    {
      id: 9,
      name: "주거래하나 통장",
      category: "통장",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 0,
      maxAmount: null,
      minPeriod: 0,
      maxPeriod: null,
      baseRate: 0.1,
      maxRate: 0.8,
      preferentialConditions: [
        { name: "주거래", bonus: 0.7 },
        { name: "자동이체", bonus: 0.4 },
      ],
      description: "주거래 우대 통장",
    },
    {
      id: 10,
      name: "달달 하나 통장",
      category: "통장",
      rateType: "일반",
      targetCustomers: "일반고객",
      minAmount: 0,
      maxAmount: null,
      minPeriod: 0,
      maxPeriod: null,
      baseRate: 0.1,
      maxRate: 0.7,
      preferentialConditions: [
        { name: "급여이체", bonus: 0.6 },
        { name: "자동이체", bonus: 0.3 },
      ],
      description: "달달 하나 통장",
    },
  ],

  // 상품 조합 시나리오
  combinations: [
    {
      name: "급여하나 적금 + 3·6·9 정기예금",
      description: "급여이체 우대 적금과 정기예금 조합으로 안정적인 수익 추구",
      expectedReturnRate: 2.6,
      riskLevel: "낮음",
      targetCustomers: "급여이체 고객",
      products: [
        { name: "급여하나 적금", rate: 2.5, period: "12개월" },
        { name: "3·6·9 정기예금", rate: 2.7, period: "6개월" },
      ],
    },
    {
      name: "고단위 플러스 조합",
      description: "고액고객용 정기예금 조합으로 최적의 수익률 추구",
      expectedReturnRate: 3.35,
      riskLevel: "보통",
      targetCustomers: "고액고객",
      products: [
        { name: "고단위 플러스(금리확정형)", rate: 3.5, period: "24개월" },
        { name: "고단위 플러스(금리연동형)", rate: 3.2, period: "12개월" },
      ],
    },
    {
      name: "ISA + 지수플러스 조합",
      description: "세제혜택과 지수연동을 통한 최적화된 투자 전략",
      expectedReturnRate: 2.6,
      riskLevel: "보통",
      targetCustomers: "일반고객",
      products: [
        { name: "ISA 정기예금", rate: 2.4, period: "12개월" },
        { name: "지수플러스 정기예금", rate: 2.8, period: "24개월" },
      ],
    },
    {
      name: "통장 + 정기예금 조합",
      description: "유동성과 수익성을 동시에 확보하는 전략",
      expectedReturnRate: 1.8,
      riskLevel: "낮음",
      targetCustomers: "일반고객",
      products: [
        { name: "급여하나 통장", rate: 1.0, period: "일반" },
        { name: "하나의 정기예금", rate: 2.6, period: "12개월" },
      ],
    },
  ],
};

// 시뮬레이션 계산 함수
export const calculateSimulation = (
  amount,
  periodMonths,
  product,
  preferentialConditions = [],
  isDeposit = false // 예금인지 적금인지 구분
) => {
  let totalRate = product.baseRate;

  // 우대조건 적용
  if (preferentialConditions.length > 0) {
    const applicableConditions = product.preferentialConditions.filter(
      (condition) => preferentialConditions.includes(condition.name)
    );
    const totalBonus = applicableConditions.reduce(
      (sum, condition) => sum + condition.bonus,
      0
    );
    totalRate += totalBonus;
  }

  let finalAmount;
  let interestAmount;

  if (isDeposit) {
    // 예금: 한 번에 예치하는 방식
    // amount는 이미 총 납입금액 (적금의 총 납입금액과 동일)
    interestAmount = amount * (totalRate / 100) * (periodMonths / 12);
    finalAmount = amount + interestAmount;
  } else {
    // 적금: 월 납입 방식 (적금 이자 계산)
    // amount는 월 납입금액
    const totalDeposit = amount * periodMonths; // 총 납입금액

    // 적금 이자 계산: 매월 납입금액이 다른 기간 동안 이자를 받음
    // 첫 달 납입금: periodMonths개월, 둘째 달: periodMonths-1개월, ..., 마지막 달: 1개월
    // 평균 기간 = (periodMonths + 1) / 2
    const averagePeriod = (periodMonths + 1) / 2;
    interestAmount = totalDeposit * (totalRate / 100) * (averagePeriod / 12);
    finalAmount = totalDeposit + interestAmount;
  }

  return {
    baseRate: product.baseRate,
    preferentialBonus: totalRate - product.baseRate,
    totalRate,
    amount: isDeposit ? amount : amount * periodMonths, // 예금은 총액, 적금은 총 납입액
    periodMonths,
    interestAmount,
    finalAmount,
    productName: product.name,
  };
};

// What-if 시나리오 생성 함수
export const generateWhatIfScenarios = (baseAmount, basePeriod) => {
  const scenarios = [];

  // 시나리오 1: 금액별 비교
  const amounts = [
    baseAmount * 0.5,
    baseAmount,
    baseAmount * 2,
    baseAmount * 5,
  ];
  amounts.forEach((amount) => {
    const comparisons = depositProductsData.termDeposits
      .map((product) => calculateSimulation(amount, basePeriod, product))
      .sort((a, b) => b.finalAmount - a.finalAmount);

    scenarios.push({
      type: "amount_variation",
      amount,
      period: basePeriod,
      topProducts: comparisons.slice(0, 3),
      description: `${amount.toLocaleString()}원 기준 상품 비교`,
    });
  });

  // 시나리오 2: 기간별 비교
  const periods = [6, 12, 24, 36];
  periods.forEach((period) => {
    const comparisons = depositProductsData.termDeposits
      .map((product) => calculateSimulation(baseAmount, period, product))
      .sort((a, b) => b.finalAmount - a.finalAmount);

    scenarios.push({
      type: "period_variation",
      amount: baseAmount,
      period,
      topProducts: comparisons.slice(0, 3),
      description: `${period}개월 기준 상품 비교`,
    });
  });

  // 시나리오 3: 우대조건별 비교
  const conditionSets = [
    { conditions: [], desc: "기본" },
    { conditions: ["급여이체"], desc: "급여이체" },
    { conditions: ["급여이체", "자동이체"], desc: "급여이체+자동이체" },
  ];

  conditionSets.forEach(({ conditions, desc }) => {
    const comparisons = depositProductsData.termDeposits
      .map((product) =>
        calculateSimulation(baseAmount, basePeriod, product, conditions)
      )
      .sort((a, b) => b.finalAmount - a.finalAmount);

    scenarios.push({
      type: "preferential_variation",
      amount: baseAmount,
      period: basePeriod,
      conditions,
      topProducts: comparisons.slice(0, 3),
      description: `우대조건: ${desc}`,
    });
  });

  return scenarios;
};

// 차트용 데이터 생성 함수
export const generateChartData = (simulationData) => {
  // 행원이 설정한 실제 시뮬레이션 조건 가져오기
  const monthlyAmount = simulationData?.simulationAmount || 20000000; // 행원이 설정한 월 납입금액
  const currentPeriod = simulationData?.simulationPeriod || 24; // 행원이 설정한 기간
  const currentRate = simulationData?.calculatedRate || 2.0; // 행원이 설정한 현재 적용 금리

  // 적금의 총 납입금액 계산 (예금 비교용)
  const totalDepositAmount = monthlyAmount * currentPeriod;

  console.log("🔍 generateChartData 호출됨:", {
    monthlyAmount,
    currentPeriod,
    currentRate,
    totalDepositAmount,
    simulationData,
  });

  // 현재 조건 시뮬레이션 (적금 방식) - 항상 새로 계산
  const currentSimulation = (() => {
    // 적금 이자 계산: 평균 기간 사용
    const averagePeriod = (currentPeriod + 1) / 2;
    const interestAmount =
      totalDepositAmount * (currentRate / 100) * (averagePeriod / 12);

    const result = {
      finalAmount: totalDepositAmount + interestAmount,
      totalRate: currentRate,
      totalDeposit: totalDepositAmount,
      expectedInterest: interestAmount,
    };

    console.log("🔍 현재 조건 계산:", {
      monthlyAmount,
      currentPeriod,
      currentRate,
      totalDepositAmount,
      averagePeriod,
      interestAmount,
      result,
    });

    return result;
  })();

  // 실제 하나은행 상품들로 비교 데이터 생성 (현재 조건과 동일한 금액/기간으로)
  const chartData = [
    {
      name: "현재 조건",
      amount: currentSimulation.finalAmount,
      fill: "#2ecc71",
      rate: currentSimulation.totalRate,
      category: "현재상품",
      rateType: "현재적용",
    },
    // 실제 정기예금 상품들 (적금의 총 납입금액으로 계산)
    ...depositProductsData.termDeposits
      .slice(0, 5)
      .map((product, index) => {
        // 예금은 적금의 총 납입금액과 비교해야 함
        if (totalDepositAmount < product.minAmount) {
          console.log(
            `⚠️ ${
              product.name
            }: 최소금액 ${product.minAmount.toLocaleString()}원 필요, 현재 총 납입금액 ${totalDepositAmount.toLocaleString()}원`
          );
          return null;
        }

        // 예금은 총 납입금액을 한 번에 예치하는 방식으로 계산
        const simulation = calculateSimulation(
          totalDepositAmount,
          currentPeriod,
          product,
          [],
          true // 예금임을 표시
        );
        const colors = ["#3498db", "#9b59b6", "#e67e22", "#8e44ad", "#1abc9c"];

        console.log(`📊 예금상품 ${product.name} 계산:`, {
          totalDepositAmount,
          currentPeriod,
          simulation,
        });

        return {
          name: product.name,
          amount: simulation.finalAmount,
          fill: colors[index],
          rate: simulation.totalRate,
          category: product.category,
          rateType: product.rateType,
          minAmount: product.minAmount,
        };
      })
      .filter(Boolean), // null 값 제거
    // 상품 조합 시나리오 (적금의 총 납입금액으로)
    ...depositProductsData.combinations.slice(0, 2).map((combo, index) => {
      const colors = ["#e74c3c", "#f39c12"];
      const comboAmount =
        totalDepositAmount *
        (1 + ((combo.expectedReturnRate / 100) * currentPeriod) / 12);

      console.log(`🔗 조합상품 ${combo.name} 계산:`, {
        totalDepositAmount,
        currentPeriod,
        comboAmount,
      });

      return {
        name: combo.name,
        amount: comboAmount,
        fill: colors[index],
        rate: combo.expectedReturnRate,
        category: "조합상품",
        riskLevel: combo.riskLevel,
      };
    }),
  ];

  console.log("✅ 최종 차트 데이터:", chartData);
  return chartData;
};

export default depositProductsData;
