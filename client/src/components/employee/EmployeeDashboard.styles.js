import styled, { keyframes } from "styled-components";

// 녹음 상태 애니메이션
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
  }
`;

const blink = keyframes`
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
`;

// 녹음 상태 표시 컴포넌트
export const RecordingStatus = styled.div`
  margin-top: var(--hana-space-3);
  padding: var(--hana-space-4);
  background: #dc3545;
  border-radius: 8px;
  border: 1px solid #c82333;
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
`;

export const RecordingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hana-space-2);
  margin-bottom: var(--hana-space-2);
`;

export const RecordingDot = styled.div`
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: ${blink} 1s infinite;
`;

export const RecordingText = styled.span`
  font-weight: 600;
  font-size: var(--hana-font-size-lg);
`;

export const RecordingTimer = styled.div`
  font-size: var(--hana-font-size-xl);
  font-weight: 700;
  font-family: monospace;
`;

export const RecordingDescription = styled.div`
  font-size: var(--hana-font-size-sm);
  opacity: 0.9;
  margin-top: var(--hana-space-1);
`;

// 메인 컨테이너
export const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh; /* 최소 높이를 100vh로 설정 */
  background-color: var(--hana-bg-gray);
  font-family: var(--hana-font-family);
  position: relative;

  /* 태블릿에서는 높이 조정 */
  @media (min-width: 768px) {
    min-height: 100vh;
  }

  /* 모바일에서는 기존 높이 유지 */
  @media (max-width: 767px) {
    height: 149.25vh; /* 100vh / 0.67 = 149.25vh */
  }
`;

// 사이드바 토글 버튼
export const SidebarToggle = styled.button`
  position: fixed;
  top: 20px;
  left: ${(props) => (props.isOpen ? "320px" : "20px")};
  z-index: 1001;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #1e3c72;
  border: 1px solid #1e3c72;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30, 60, 114, 0.2);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #2a5298;
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
`;

// 사이드바 오버레이
export const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transition: all 0.3s ease;
`;

// 사이드바
export const Sidebar = styled.div`
  position: fixed;
  left: ${(props) => (props.isOpen ? "0" : "-320px")};
  top: 0;
  width: 320px;
  min-height: 100vh; /* 최소 높이를 100vh로 설정 */
  background: #ffffff;
  border-right: 1px solid #e1e5e9;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: left 0.3s ease;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 2rem;
  max-height: 100vh;

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 태블릿에서는 높이 조정 */
  @media (min-width: 768px) {
    min-height: 100vh;
  }

  /* 모바일에서는 기존 높이 유지 */
  @media (max-width: 767px) {
    height: 149.25vh; /* 100vh / 0.67 = 149.25vh */
  }
`;

// 메인 콘텐츠
export const MainContent = styled.div`
  margin-left: ${(props) => (props.sidebarOpen ? "320px" : "0")};
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto; /* 스크롤 허용 */
  min-height: 100vh; /* 최소 높이를 100vh로 설정 */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-top: 0;

  /* 태블릿에서는 높이 조정 */
  @media (min-width: 768px) {
    min-height: 100vh;
    overflow: auto;
  }

  /* 모바일에서는 기존 높이 유지 */
  @media (max-width: 767px) {
    height: 149.25vh; /* 100vh / 0.67 = 149.25vh */
    overflow: hidden;
  }
`;

// 세션 상태
export const SessionStatus = styled.div`
  padding: var(--hana-space-4) var(--hana-space-6);
  border-radius: var(--hana-radius-full);
  font-size: var(--hana-font-size-base);
  font-weight: 700;
  background: ${(props) =>
    props.active ? "var(--hana-success)" : "rgba(255, 255, 255, 0.2)"};
  color: var(--hana-white);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: var(--hana-space-3);
  min-width: 200px;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: "";
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${(props) =>
      props.active ? "var(--hana-white)" : "rgba(255, 255, 255, 0.6)"};
    animation: ${(props) => (props.active ? "pulse 2s infinite" : "none")};
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

// 콘텐츠 영역
export const ContentArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

// 섹션
export const Section = styled.div`
  padding: var(--hana-space-6);
  border-bottom: var(--hana-border-light);

  &:last-child {
    border-bottom: none;
  }
`;

// 섹션 제목
export const SectionTitle = styled.h3`
  color: var(--hana-primary);
  margin-bottom: var(--hana-space-4);
  font-size: var(--hana-font-size-xl);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--hana-space-2);

  &::before {
    content: "";
    width: 4px;
    height: 24px;
    background: linear-gradient(135deg, var(--hana-primary), var(--hana-mint));
    border-radius: var(--hana-radius-sm);
  }
`;

// 버튼
export const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  &.primary {
    background: #1e3c72;
    color: white;
    border: 1px solid #1e3c72;
    box-shadow: 0 2px 8px rgba(30, 60, 114, 0.2);

    &:hover {
      background: #2a5298;
      box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
    }

    &:active {
      transform: translateY(1px);
    }
  }

  &.secondary {
    background: white;
    color: #1e3c72;
    border: 1px solid #1e3c72;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      background: #f8f9fa;
      border-color: #2a5298;
      color: #2a5298;
    }

    &:active {
      transform: translateY(1px);
    }
  }

  &.outlined {
    background: transparent;
    color: #1e3c72;
    border: 1px solid #e1e5e9;

    &:hover {
      border-color: #1e3c72;
      background: #f8f9fa;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;

    &:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  }
`;

// 네비게이션 탭들
export const NavigationTabs = styled.div`
  display: flex;
  gap: var(--hana-space-4);
  margin: 0;
  align-items: center;
  flex-wrap: wrap;
`;

// 네비게이션 탭
export const NavTab = styled.button`
  padding: 12px 24px;
  background: ${(props) => (props.active ? "#1e3c72" : "white")};
  border: 1px solid ${(props) => (props.active ? "#1e3c72" : "#e1e5e9")};
  border-radius: 8px;
  color: ${(props) => (props.active ? "white" : "#1e3c72")};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
  box-shadow: ${(props) =>
    props.active
      ? "0 2px 8px rgba(30, 60, 114, 0.2)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)"};

  &:hover {
    background: ${(props) => (props.active ? "#2a5298" : "#f8f9fa")};
    border-color: ${(props) => (props.active ? "#2a5298" : "#1e3c72")};
    color: ${(props) => (props.active ? "white" : "#1e3c72")};
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: 768px) {
    min-width: 100px;
    padding: 8px 16px;
    font-size: 12px;
  }
`;

// 탭 컨테이너
export const TabContainer = styled.div`
  display: flex;
  background: var(--hana-white);
  border-bottom: var(--hana-border-light);
  box-shadow: var(--hana-shadow-light);
`;

// 탭
export const Tab = styled.button`
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: ${(props) => (props.active ? "#1e3c72" : "transparent")};
  color: ${(props) => (props.active ? "white" : "#6c757d")};
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid
    ${(props) => (props.active ? "#1e3c72" : "transparent")};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  position: relative;

  &:hover {
    background: ${(props) => (props.active ? "#2a5298" : "#f8f9fa")};
    color: ${(props) => (props.active ? "white" : "#1e3c72")};
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${(props) => (props.active ? "#1e3c72" : "transparent")};
    transition: all 0.2s ease;
  }
`;

// 고객 카드
export const CustomerCard = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: #1e3c72;
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
  }

  &:active {
    transform: translateY(1px);
  }

  &.selected {
    border-color: #1e3c72;
    background: #f8f9fa;
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
  }
`;

// 고객 이름
export const CustomerName = styled.div`
  font-size: var(--hana-font-size-lg);
  font-weight: 700;
  color: var(--hana-black);
  margin-bottom: var(--hana-space-1);
`;

// 고객 세부사항
export const CustomerDetails = styled.div`
  font-size: var(--hana-font-size-sm);
  color: var(--hana-gray);
  display: flex;
  flex-direction: column;
  gap: var(--hana-space-1);

  .customer-id {
    font-weight: 600;
    color: var(--hana-primary);
  }

  .customer-phone {
    color: var(--hana-dark-gray);
  }
`;

// 상태 배지
export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: var(--hana-space-1) var(--hana-space-3);
  font-size: var(--hana-font-size-xs);
  font-weight: 600;
  border-radius: var(--hana-radius-full);
  margin-top: var(--hana-space-2);

  &.waiting {
    background: var(--hana-orange-light);
    color: var(--hana-orange);
  }

  &.in-progress {
    background: var(--hana-mint-light);
    color: var(--hana-primary);
  }

  &.completed {
    background: var(--hana-success-light);
    color: var(--hana-success);
  }
`;

// 카메라 컨테이너
export const CameraContainer = styled.div`
  position: relative;
  margin-bottom: var(--hana-space-4);
  border-radius: var(--hana-radius-lg);
  overflow: hidden;
  background: var(--hana-black);
  box-shadow: var(--hana-shadow-medium);
`;

// 카메라 오버레이
export const CameraOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--hana-white);
  text-align: center;
  z-index: 2;
  background: rgba(0, 0, 0, 0.8);
  padding: var(--hana-space-4);
  border-radius: var(--hana-radius-md);
  backdrop-filter: blur(4px);
`;

// 파일 입력
export const FileInput = styled.input`
  display: none;
`;

// 파일 입력 라벨
export const FileInputLabel = styled.label`
  display: block;
  padding: 0.75rem 1.5rem;
  background: var(--hana-mint);
  color: white;
  border-radius: var(--hana-radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--hana-transition-base);
  margin-bottom: var(--hana-space-3);
  padding: var(--hana-space-4);
  background: var(--hana-white);
  border: 2px dashed var(--hana-light-gray);
  color: var(--hana-primary);
  font-weight: 600;

  &:hover {
    border-color: var(--hana-primary);
    background: var(--hana-primary-light);
  }
`;

// 탭 콘텐츠
export const TabContent = styled.div`
  flex: 1;
  overflow: auto;
  background: var(--hana-white);
`;

// 대시보드 그리드
export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--hana-space-5);
  margin-bottom: var(--hana-space-5);
  margin-top: var(--hana-space-2);
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: var(--hana-space-4);
  }
`;

// 그리드 섹션
export const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--hana-space-4);
  min-height: 600px;
`;
