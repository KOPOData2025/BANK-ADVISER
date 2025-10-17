// 하나은행 금리 데이터 유틸리티
import ratesData from "../data/hana_crawled_rates.json";

// 상품명 매핑 (상품 데이터와 금리 데이터의 차이를 보정)
const productNameMapping = {
  "(아이) 꿈하나 적금": "아이 꿈하나 적금",
  "급여하나 월복리 적금": "급여하나 월복리 적금",
  "내집마련 더블업(Double-Up)적금": "내집마련 더블업 적금",
  "달달 하나 적금": "급여하나 월복리 적금",
  "부자씨 적금": "부자씨 적금",
  "하나 아이키움 적금": "하나 아이키움 적금",
  "대전하나 축구사랑 적금": "대전하나 축구사랑 적금",
  "하나 적금": "하나 적금",
  청년희망적금: "하나 청년희망 적금",
  "하나Family 적금": "하나 가족사랑 적금",
};

// 기간 문자열을 개월로 변환
const parsePeriodToMonths = (period) => {
  if (!period) return 0;

  const periodStr = period.toString().toLowerCase();

  if (periodStr.includes("년")) {
    const years = parseInt(periodStr.match(/(\d+)년/)?.[1] || "0");
    return years * 12;
  }

  if (periodStr.includes("월")) {
    return parseInt(periodStr.match(/(\d+)월/)?.[1] || "0");
  }

  if (periodStr.includes("개월")) {
    return parseInt(periodStr.match(/(\d+)개월/)?.[1] || "0");
  }

  // 숫자만 있는 경우 개월로 간주
  const numMatch = periodStr.match(/^\d+$/);
  if (numMatch) {
    return parseInt(numMatch[0]);
  }

  return 0;
};

// 금리 문자열에서 숫자 추출
const parseInterestRate = (rateStr) => {
  if (!rateStr) return 0;
  const match = rateStr.toString().match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

// 특정 상품의 금리 정보 조회
export const getProductInterestRates = (productName) => {
  // 매핑된 이름으로 변환
  const mappedName = productNameMapping[productName] || productName;

  // 정확한 매치 찾기
  let productRates = ratesData[mappedName];

  // 정확한 매치가 없으면 부분 매치 시도
  if (!productRates) {
    const cleanProductName = productName.replace(/[\(\)]/g, "").trim();
    const foundKey = Object.keys(ratesData).find((key) => {
      const cleanKey = key
        .replace(/[\(\)]/g, "")
        .replace(/\(판매중단\)/g, "")
        .replace(/\(한시판매\)/g, "")
        .trim();
      return (
        cleanKey.includes(cleanProductName) ||
        cleanProductName.includes(cleanKey)
      );
    });

    if (foundKey) {
      productRates = ratesData[foundKey];
    }
  }

  if (!productRates?.데이터) return [];

  return productRates.데이터
    .map((item) => ({
      period: item.기간,
      periodMonths: parsePeriodToMonths(item.기간),
      interestRate: parseInterestRate(item["금리(연율,세전)"]),
      rateDisplay: item["금리(연율,세전)"],
    }))
    .sort((a, b) => a.periodMonths - b.periodMonths);
};

// 기간에 따른 최적 금리 조회
export const getBestRateForPeriod = (productName, targetMonths) => {
  const rates = getProductInterestRates(productName);
  if (!rates.length) return null;

  // 정확한 기간 매치 찾기
  const exactMatch = rates.find((rate) => rate.periodMonths === targetMonths);
  if (exactMatch) return exactMatch;

  // 가장 가까운 기간 찾기
  const closestRate = rates.reduce((closest, current) => {
    const currentDiff = Math.abs(current.periodMonths - targetMonths);
    const closestDiff = Math.abs(closest.periodMonths - targetMonths);
    return currentDiff < closestDiff ? current : closest;
  });

  return closestRate;
};

// 모든 금리 데이터 조회 (디버깅용)
export const getAllRatesData = () => ratesData;

// 상품 카테고리별 평균 금리 계산
export const getAverageRateByCategory = (categoryProducts) => {
  const allRates = [];

  categoryProducts.forEach((productName) => {
    const rates = getProductInterestRates(productName);
    rates.forEach((rate) => allRates.push(rate.interestRate));
  });

  if (allRates.length === 0) return 0;

  const sum = allRates.reduce((acc, rate) => acc + rate, 0);
  return (sum / allRates.length).toFixed(2);
};

export default {
  getProductInterestRates,
  getBestRateForPeriod,
  getAllRatesData,
  getAverageRateByCategory,
};
