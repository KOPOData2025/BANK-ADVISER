// 하나은행 실제 상품 데이터
export const productCategories = {
  "예금": [
    "3·6·9 정기예금",
    "고단위 플러스(금리연동형)", 
    "고단위 플러스(금리확정형)",
    "양도성예금증서(CD)",
    "외화고단위플러스 정기예금(금리연동형)",
    "외화고단위플러스 정기예금(금리확정형)", 
    "외화양도성예금증서(통장식)",
    "외화정기예금",
    "정기예금",
    "표지어음",
    "하나의 정기예금",
    "행복knowhow 연금예금",
    "1년 연동형 정기예금"
  ],
  "적금": [
    "(내맘) 적금",
    "(아이) 꿈하나 적금", 
    "(K리그) 우승 적금",
    "급여하나 월복리 적금",
    "내집마련 더블업(Double-Up)적금",
    "달달 하나 적금",
    "대전하나 축구사랑 적금",
    "도전365 적금",
    "부자씨 적금",
    "상호부금",
    "손님케어 적금",
    "하나 아이키움 적금",
    "하나 중소기업재직자 우대저축",
    "하나Family 적금",
    "하나 적금",
    "행복나눔 적금",
    "행복한 하나적금",
    "청년희망적금",
    "청년 주택드림 청약통장",
    "주택청약종합저축"
  ],
  "대출": [
    "급여하나 신용대출",
    "하나원큐 간편대출", 
    "신용대출",
    "아파트담보대출",
    "주택담보대출",
    "전세자금대출",
    "중도금대출",
    "리모델링대출",
    "마이너스통장대출",
    "자동차담보대출",
    "사업자대출",
    "개인사업자대출"
  ],
  "투자": [
    "하나 MMF",
    "하나 CMA",
    "펀드",
    "ELS/DLS",
    "신탁상품",
    "ISA 계좌",
    "연금저축",
    "IRP",
    "해외주식",
    "국내주식",
    "외화예금",
    "골드바 거래"
  ]
};

// 샘플 상품 상세 정보 (실제 JSON에서 가져온 데이터)
export const productDetails = {
  "(내맘) 적금": {
    productName: "(내맘) 적금",
    productType: "적금",
    productFeatures: "저축금액, 만기일, 자동이체 구간까지 내 맘대로 디자인하는 DIY적금",
    targetCustomers: "실명의 개인 또는 개인사업자",
    depositPeriod: "6개월 이상 ~ 60개월 이하 (월 또는 일단위 지정)",
    depositAmount: "매월 1천원 이상 ~ 1천만원 이하",
    interestRate: "2.0% ~ 2.4% (정액적립식 기준)",
    preferentialRate: "연 0.50% (자동이체실적 충족시)",
    taxBenefits: "비과세종합저축 가능 (전 금융기관 통합한도 범위내)",
    withdrawalConditions: "만기일 이전 총 2회 일부해지 가능",
    notes: "만기일 전 중도해지 시 약정금리보다 낮은 금리 적용"
  },
  "급여하나 월복리 적금": {
    productName: "급여하나 월복리 적금",
    productType: "적금",
    productFeatures: "급여 하나로 OK! 월복리로 이자에 이자가 OK!",
    targetCustomers: "실명의 개인 또는 개인사업자 (1인 1계좌)",
    depositPeriod: "1년, 2년, 3년",
    depositAmount: "1만원 이상 300만원 이하 (원단위)",
    interestRate: "시장금리 연동 (월복리 적용)",
    preferentialRate: "최대 연1.00% (급여하나 우대 연0.90% + 온라인 재예치 우대 연0.10%)",
    taxBenefits: "비과세종합저축 가능",
    withdrawalConditions: "특별중도해지 사유 시 기본금리 적용",
    notes: "청년응원 특별금리 연 1.3% (만 35세 이하, 1년제 가입시)"
  },
  "달달 하나 적금": {
    productName: "달달 하나 적금",
    productType: "적금",
    productFeatures: "하나원큐 전용 상품으로 최대 연 5.00% 우대금리 제공",
    targetCustomers: "만 14세 이상 실명의 개인 및 개인사업자 (1인 1계좌)",
    depositPeriod: "1년",
    depositAmount: "매월 1만원 이상 ~ 30만원 이하",
    interestRate: "기본금리 + 우대금리 (최대 연 5.00%)",
    preferentialRate: "급여이체 우대 1.00% + 하나카드 결제 0.50% + 이벤트 특별금리 최고 3.50%",
    taxBenefits: "비과세종합저축 가능",
    withdrawalConditions: "만기일 이전 2회까지 일부해지 가능",
    notes: "2025.12.31까지 3만좌 한정 판매"
  },
  "하나 청년도약계좌": {
    productName: "하나 청년도약계좌",
    productType: "적금",
    productFeatures: "청년의 중장기 자산형성 지원을 위한 금융 상품으로, 정부 기여금 및 비과세 혜택 제공",
    targetCustomers: "가입대상 기준에 따라 선정된 개인 및 개인사업자",
    depositPeriod: "5년",
    depositAmount: "매월 1천원 이상 ~ 70만원 이하",
    interestRate: "최초3년 고정, 3년 초과~5년 이내 매 1년마다 변동",
    preferentialRate: "최대 연 1.50% (급여이체, 카드결제, 목돈마련응원, 마케팅동의, 소득플러스 등)",
    taxBenefits: "비과세저축 + 정부기여금 (소득구간별 최대 6.0% 지급)",
    withdrawalConditions: "가입 2년 경과 후 납입액의 최대 40% 이내 1회 부분인출 가능",
    notes: "청년희망적금 만기해지자 일시납입 신규 가능"
  },
  "청년 주택드림 청약통장": {
    productName: "청년 주택드림 청약통장",
    productType: "적금", 
    productFeatures: "가입자격 및 무주택 조건 등을 충족하는 경우 최대 4.5% 이율 제공",
    targetCustomers: "만 19세 ~ 만 34세 이하의 무주택 거주자 (연소득 5천만원 이하)",
    depositPeriod: "가입일로부터 해지일까지",
    depositAmount: "매월 2만원 ~ 100만원",
    interestRate: "최대 4.5% (무주택 기간 기준)",
    preferentialRate: "무주택 기간에 따른 우대금리",
    taxBenefits: "이자소득 500만원까지, 연간불입액 600만원 한도 비과세, 연간 납입액의 40% 소득공제 (최대 120만원)",
    withdrawalConditions: "주택청약 당첨시 계약금 납부목적 일부 인출 가능",
    notes: "전환신규 가능, 주택청약종합저축 연속 인정"
  },
  "주택청약종합저축": {
    productName: "주택청약종합저축",
    productType: "적금",
    productFeatures: "주택청약과 저축을 동시에 할 수 있는 상품",
    targetCustomers: "국민인 개인 (국내에 거주하는 재외동포 포함) 또는 외국인거주자",
    depositPeriod: "가입한 날로부터 입주자로 선정된 날까지",
    depositAmount: "매월 2만원 이상 50만원 이하",
    interestRate: "변동금리 (국토교통부 고시)",
    preferentialRate: "해당없음",
    taxBenefits: "비과세종합저축 가능",
    withdrawalConditions: "주택청약 당첨시 해지",
    notes: "전 금융기관에 걸쳐 1인 1계좌만 가입 가능"
  },
  "3·6·9 정기예금": {
    productName: "3·6·9 정기예금",
    productType: "예금",
    productFeatures: "3개월, 6개월, 9개월 단기 정기예금으로 자금 운용 효율성 극대화",
    targetCustomers: "실명의 개인 및 법인",
    depositPeriod: "3개월, 6개월, 9개월",
    depositAmount: "1천만원 이상",
    interestRate: "시장금리 연동 (예치기간별 차등 적용)",
    preferentialRate: "신규자금 우대금리 제공",
    taxBenefits: "법인 비과세종합저축 가능",
    withdrawalConditions: "만기일시지급",
    notes: "중도해지시 약정금리보다 낮은 금리 적용"
  },
  "하나의 정기예금": {
    productName: "하나의 정기예금",
    productType: "예금",
    productFeatures: "다양한 금리 옵션과 우대 혜택을 제공하는 대표 정기예금",
    targetCustomers: "실명의 개인 및 법인",
    depositPeriod: "1개월 이상 ~ 36개월 이하",
    depositAmount: "1천원 이상",
    interestRate: "시장금리 연동 (예치기간별 차등)",
    preferentialRate: "신규자금, 장기가입, 온라인 가입 우대",
    taxBenefits: "비과세종합저축 가능",
    withdrawalConditions: "만기일시지급",
    notes: "인터넷/모바일 가입시 우대금리 제공"
  },
  "급여하나 신용대출": {
    productName: "급여하나 신용대출",
    productType: "대출",
    productFeatures: "급여이체 고객 대상 우대금리 신용대출로 간편하고 저렴한 자금 조달",
    targetCustomers: "급여이체 실적이 있는 직장인",
    depositPeriod: "1년 ~ 5년",
    depositAmount: "100만원 ~ 1억원",
    interestRate: "연 3.5% ~ 15.9% (신용등급 및 우대조건에 따라 차등)",
    preferentialRate: "급여이체 실적, 거래실적에 따른 우대금리",
    taxBenefits: "해당없음",
    withdrawalConditions: "중도상환 가능 (중도상환수수료 별도)",
    notes: "소득증빙서류 간소화, 하나원큐에서 간편 신청"
  },
  "하나 MMF": {
    productName: "하나 MMF",
    productType: "투자",
    productFeatures: "단기금융상품에 투자하는 머니마켓펀드로 높은 유동성과 안정성 제공",
    targetCustomers: "개인 및 법인 투자자",
    depositPeriod: "제한 없음 (수시 입출금 가능)",
    depositAmount: "1만원 이상",
    interestRate: "시장금리 연동 (변동, 일별 수익률 공시)",
    preferentialRate: "해당없음",
    taxBenefits: "분리과세 15.4% 적용",
    withdrawalConditions: "언제든지 환매 가능 (T+1 지급)",
    notes: "원본손실 가능성 있음, 예금자보호법 적용 제외"
  },
  "ISA 계좌": {
    productName: "ISA 계좌",
    productType: "투자",
    productFeatures: "개인종합자산관리계좌로 예금, 적금, 펀드 등을 통합 운용하여 세제혜택 제공",
    targetCustomers: "만 15세 이상 거주자",
    depositPeriod: "3년 이상 (연장 가능)",
    depositAmount: "연간 2,000만원 한도 (일반형), 연간 4,000만원 한도 (서민형)",
    interestRate: "상품별 상이 (예금, 적금, 펀드 등 선택 가능)",
    preferentialRate: "해당없음",
    taxBenefits: "200만원까지 비과세 (서민형 400만원), 초과분 9.9% 분리과세",
    withdrawalConditions: "3년 후 자유로운 인출 가능",
    notes: "다양한 금융상품 통합 관리 가능, 펀드 투자시 원본손실 위험"
  }
};

// 상품 타입별 아이콘
export const productIcons = {
  "예금": "💰",
  "적금": "🏦", 
  "대출": "💳",
  "투자": "📈"
};

// 상품 타입별 색상
export const productColors = {
  "예금": "#2E7D32",
  "적금": "#1976D2", 
  "대출": "#F57C00",
  "투자": "#7B1FA2"
};
