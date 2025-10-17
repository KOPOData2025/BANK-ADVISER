import styled from "styled-components";

// 메인 컨테이너
export const TabletContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  transition: all 0.3s ease;

  /* 태블릿 최적화 */
  @media (min-width: 768px) {
    height: 100vh;
    width: 100vw;
  }

  /* PWA 모드에서 추가 최적화 */
  @media (display-mode: standalone) {
    height: 100vh;
    width: 100vw;
  }
`;

// 사이드바 토글 버튼
export const SidebarToggle = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  svg {
    width: 24px;
    height: 24px;
    color: #2d3748;
  }
`;

// 사이드바
export const Sidebar = styled.div`
  position: absolute;
  top: 0;
  left: ${(props) => (props.isOpen ? "0" : "-350px")};
  width: 350px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: left 0.3s ease;
  overflow-y: auto;
  padding: 2rem;
  box-shadow: ${(props) =>
    props.isOpen ? "5px 0 25px rgba(0, 0, 0, 0.2)" : "none"};
`;

// 사이드바 섹션
export const SidebarSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

// 사이드바 제목
export const SidebarTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
`;

// 사이드바 버튼
export const SidebarButton = styled.button`
  width: 100%;
  padding: 0.8rem 1rem;
  margin: 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

// 고객 정보 박스
export const CustomerInfoBox = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

// 고객 이름
export const CustomerName = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: 700;
`;

// 고객 세부사항
export const CustomerDetail = styled.p`
  margin: 0.3rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
`;

// 메인 콘텐츠
export const MainContent = styled.div`
  flex: 1;
  margin-left: ${(props) => (props.sidebarOpen ? "350px" : "0")};
  transition: margin-left 0.3s ease;
  height: 100vh;
  overflow: auto;

  /* 태블릿 최적화 */
  @media (min-width: 768px) {
    height: 100vh;
  }
`;

// 오버레이
export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.isOpen ? "block" : "none")};
`;

// 전체화면 토글 버튼
export const FullscreenToggle = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  svg {
    width: 24px;
    height: 24px;
    color: #2d3748;
  }
`;

// 애니메이션 키프레임
const fadeIn = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// 새로고침 모달
export const RefreshModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
`;

export const RefreshModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
`;

export const RefreshModalTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
`;

export const RefreshModalMessage = styled.p`
  margin: 0 0 2rem 0;
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
`;

export const RefreshModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

export const RefreshModalButton = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
  }

  &.secondary {
    background: #f7fafc;
    color: #4a5568;
    border: 2px solid #e2e8f0;

    &:hover {
      background: #edf2f7;
      border-color: #cbd5e0;
    }
  }
`;

// 추가 애니메이션 키프레임
export const pulse = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

export const rotate = `
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const slideIn = `
  @keyframes slideIn {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

export const bounce = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;
