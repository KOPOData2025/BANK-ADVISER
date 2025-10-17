import styled from "styled-components";

// 메인 컨테이너
export const CustomerContainer = styled.div`
  min-height: calc(100vh - 120px);
  background: var(--hana-gray);
  padding: 2rem;
`;

// 환영 카드
export const WelcomeCard = styled.div`
  background: linear-gradient(
    135deg,
    var(--hana-mint) 0%,
    var(--hana-mint-dark) 100%
  );
  color: white;
  padding: 3rem;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "👋";
    position: absolute;
    right: 3rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 6rem;
    opacity: 0.3;
  }
`;

// 환영 제목
export const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

// 환영 부제목
export const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;

// 콘텐츠 카드
export const ContentCard = styled.div`
  background: var(--hana-white);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 132, 133, 0.15);
  overflow: hidden;
  margin-bottom: 2rem;
`;

// 콘텐츠 헤더
export const ContentHeader = styled.div`
  background: var(--hana-mint);
  color: white;
  padding: 2rem;
  text-align: center;
`;

// 콘텐츠 제목
export const ContentTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

// 콘텐츠 부제목
export const ContentSubtitle = styled.p`
  opacity: 0.9;
`;

// 콘텐츠 본문
export const ContentBody = styled.div`
  padding: 2rem;
`;

// 상품 그리드
export const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

// 상품 카드
export const ProductCard = styled.div`
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--hana-mint);
    box-shadow: 0 4px 12px rgba(0, 132, 133, 0.1);
  }
`;

// 상품 이름
export const ProductName = styled.h3`
  color: var(--hana-mint);
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
`;

// 상품 설명
export const ProductDescription = styled.p`
  color: var(--hana-dark-gray);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

// 상품 세부사항
export const ProductDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// 상품 금리
export const ProductRate = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--hana-mint);
`;

// 시뮬레이션 결과
export const SimulationResult = styled.div`
  background: linear-gradient(
    135deg,
    var(--hana-mint-light) 0%,
    var(--hana-mint) 100%
  );
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
`;

// 결과 그리드
export const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

// 결과 아이템
export const ResultItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
`;

// 결과 라벨
export const ResultLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
`;

// 결과 값
export const ResultValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

// 서명 섹션
export const SignatureSection = styled.div`
  background: var(--hana-white);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  border: 2px dashed var(--hana-mint);
`;

// 서명 제목
export const SignatureTitle = styled.h3`
  color: var(--hana-mint);
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

// 서명 캔버스 컨테이너
export const SignatureCanvasContainer = styled.div`
  border: 2px solid var(--hana-mint);
  border-radius: 8px;
  margin: 1rem auto;
  width: fit-content;
`;

// 서명 버튼들
export const SignatureButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;

// 버튼
export const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: var(--hana-mint);
    color: white;

    &:hover {
      background: var(--hana-mint-dark);
    }
  }

  &.secondary {
    background: var(--hana-white);
    color: var(--hana-mint);
    border: 2px solid var(--hana-mint);

    &:hover {
      background: var(--hana-mint);
      color: white;
    }
  }
`;

// 로딩 오버레이
export const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

// 로딩 카드
export const LoadingCard = styled.div`
  background: var(--hana-white);
  padding: 3rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

// 상태 배지
export const StatusBadge = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &.connected {
    background: var(--hana-success);
    color: white;
  }

  &.waiting {
    background: var(--hana-warning);
    color: var(--hana-black);
  }
`;
