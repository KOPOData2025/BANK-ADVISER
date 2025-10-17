import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { getWebSocketUrl, getApiUrl } from "../../config/api";
import {
  getFieldInfo,
  autoFillDuplicateFields,
  autoFillEmployeeAndCustomerInfo,
  getCustomerInfo,
} from "../../data/fieldMapping";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import ConsentForm from "./ConsentForm";
import ApplicationForm from "./ApplicationForm";
import ElectronicFinanceForm from "../employee/ElectronicFinanceForm";
import FinancialPurposeForm from "../employee/FinancialPurposeForm";
import TabletSimulationView from "./TabletSimulationView";
import IntroSlider from "./IntroSlider";
import ModalManager from "../common/ModalManager";
import FieldInputModal from "./FieldInputModal";
import ProductRecommendationDashboard from "./ProductRecommendationDashboard";
import AIRecommendationDisplay from "./AIRecommendationDisplay";
import { generateChartData } from "../../data/depositProducts";

// Styled Components
import {
  TabletContainer,
  CustomerInfoBox,
  CustomerName,
  CustomerDetail,
  MainContent,
  FullscreenToggle,
  RefreshModal,
  RefreshModalContent,
  RefreshModalTitle,
  RefreshModalMessage,
  RefreshModalButtons,
  RefreshModalButton,
} from "./CustomerTablet.styles";

const CustomerTablet = () => {
  // 버전 정보 (캐시 무효화용)
  const VERSION = "1.0.2";
  console.log(`🚀 [태블릿] CustomerTablet v${VERSION} 로드됨`);

  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("sessionId");
    const fromStorage = localStorage.getItem("sessionId");
    return fromUrl || fromStorage || null;
  });

  const [employeeId, setEmployeeId] = useState(null); // 직원 ID 추가
  const [isEmployeeLoggedIn, setIsEmployeeLoggedIn] = useState(false); // 직원 로그인 상태
  const [loginData, setLoginData] = useState({
    // 로그인 데이터 상태 추가
    employeeId: "",
    password: "",
  });
  // 강제 초기화를 위한 상태 (제거됨 - 과도한 렌더링 방지)
  // const [forceReset, setForceReset] = useState(0);

  const [currentPage, setCurrentPage] = useState("welcome"); // 초기 페이지: welcome (메인 화면)
  const [showIntro, setShowIntro] = useState(true); // 광고 화면부터 시작
  const [currentProduct, setCurrentProduct] = useState(null); // 초기 상품: 없음
  const [currentFormIndex, setCurrentFormIndex] = useState(0); // 초기 서식 인덱스: 0
  const [currentForm, setCurrentForm] = useState(null); // 현재 서식
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 상태 추가

  // 전체화면 및 새로고침 모달 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);

  // AI 추천 관련 상태
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [recommendationConfidence, setRecommendationConfidence] = useState(0);
  const [customerName, setCustomerName] = useState("고객님");

  // AI 추천 메시지 처리 함수
  const handleAIRecommendationMessage = (data) => {
    console.log("🤖 [태블릿] AI 추천 메시지 수신:", data);

    if (data.data && data.data.recommendations) {
      setAiRecommendations(data.data.recommendations);
      setRecommendationConfidence(data.data.confidence || 0);
      setCustomerName(data.data.customerName || "고객님");
      setShowAiRecommendations(true);

      console.log("✅ [태블릿] AI 추천 결과 표시:", {
        recommendations: data.data.recommendations.length,
        confidence: data.data.confidence,
        customerName: data.data.customerName,
      });
    }
  };

  // AI 추천 관련 핸들러 함수들
  const handleCloseAIRecommendations = () => {
    setShowAiRecommendations(false);
    setAiRecommendations([]);
    console.log("❌ [태블릿] AI 추천 화면 닫기");
  };

  const handleSelectProduct = (product) => {
    console.log("🎯 [태블릿] 상품 선택:", product);
    setCurrentProduct(product);
    setShowAiRecommendations(false);
    // 상품 상세 페이지로 이동하거나 상품 가입 프로세스 시작
    setCurrentPage("product-enrollment");
  };

  const handleRequestMoreInfo = (product) => {
    console.log("ℹ️ [태블릿] 상품 자세히 보기:", product);
    // 상품 상세 정보 모달 열기
    openModal("productDetail", { product });
  };

  // 전체화면 토글 함수
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    console.log(`🖥️ [태블릿] 전체화면 ${!isFullscreen ? "진입" : "해제"}`);
  };

  // 새로고침 모달 열기
  const openRefreshModal = () => {
    setShowRefreshModal(true);
    console.log("🔄 [태블릿] 새로고침 모달 열기");
  };

  // 새로고침 모달 닫기
  const closeRefreshModal = () => {
    setShowRefreshModal(false);
    console.log("❌ [태블릿] 새로고침 모달 닫기");
  };

  // 실제 새로고침 실행
  const handleRefresh = () => {
    console.log("🔄 [태블릿] 새로고침 실행");
    setShowRefreshModal(false);
    window.location.reload();
  };

  // 직원 로그인 처리
  const handleEmployeeLogin = (employeeData) => {
    console.log("👤 [태블릿] 직원 로그인:", employeeData);
    setEmployeeId(employeeData.employeeId);
    setIsEmployeeLoggedIn(true);

    // 직원별 세션 ID 생성
    const newSessionId = `employee_${employeeData.employeeId}_tablet`;
    setSessionId(newSessionId);

    // WebSocket 재연결
    if (stompClient) {
      stompClient.deactivate();
    }

    console.log("🔗 [태블릿] 직원별 세션 연결:", newSessionId);
  };

  // 직원 로그아웃 처리
  const handleEmployeeLogout = () => {
    console.log("👤 [태블릿] 직원 로그아웃");
    setEmployeeId(null);
    setIsEmployeeLoggedIn(false);
    if (!sessionId) {
      const defaultId = localStorage.getItem("sessionId");
      if (defaultId) setSessionId(defaultId);
    }

    // WebSocket 재연결
    if (stompClient) {
      stompClient.deactivate();
    }

    // 태블릿 상태 초기화
    setCurrentPage("welcome");
    resetTabletState(true);
  };

  // ESC 키로 전체화면 해제
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        console.log("⌨️ [태블릿] ESC 키로 전체화면 해제");
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log("🚀 [태블릿] 컴포넌트 마운트 - 초기화 시작");
    console.log("🚀 [태블릿] 초기 currentPage:", "welcome");
    console.log("🚀 [태블릿] 초기 currentForm:", null);
    console.log("🚀 [태블릿] 초기 showIntro:", true);

    // 강제 초기화 - 모든 상태를 명시적으로 리셋
    setCurrentPage("welcome");
    setCurrentForm(null);
    setCurrentFormIndex(0);
    setCurrentProduct(null);
    // setShowIntro(false); // 인트로는 유지
    // setForceReset((prev) => prev + 1); // 강제 리렌더링 트리거 제거 (과도한 렌더링 방지)

    // 약간의 지연 후 초기화 완료 (WebSocket 연결 지연)
    setTimeout(() => {
      setIsInitialized(true);
      console.log("✅ [태블릿] 초기화 완료");

      // WebSocket 연결도 지연
      setTimeout(() => {
        console.log("🔌 [태블릿] WebSocket 연결 시작");
        // WebSocket 연결 로직은 여기서 실행
      }, 500);
    }, 200);
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  // 상태 변화 추적
  useEffect(() => {
    console.log("🔍 [태블릿] 상태 변화:", {
      currentPage,
      isInitialized,
      showIntro,
      currentForm: currentForm ? currentForm.formName : null,
      currentFormIndex,
    });
  }, [currentPage, isInitialized, showIntro, currentForm, currentFormIndex]);

  // 입력 필드 동기화 상태 (먼저 선언)
  const [focusedField, setFocusedField] = useState(null); // 현재 포커스된 필드
  const [fieldValues, setFieldValues] = useState({}); // 로그인 후 채움
  const [isFieldInputMode, setIsFieldInputMode] = useState(false); // 필드 입력 모드 여부
  const [highlightedElement, setHighlightedElement] = useState(null); // 하이라이트된 요소

  // 새로운 상품 정보 동기화 상태
  const [enrollmentData, setEnrollmentData] = useState(null); // 상품 가입 데이터
  const [customerMatching, setCustomerMatching] = useState(null); // 고객 조건 매칭
  const [conditionSelection, setConditionSelection] = useState(null); // 우대조건 선택
  const [productDetails, setProductDetails] = useState(null); // 상품 상세 정보

  // 수익 시뮬레이션 상태
  const [simulationAmount, setSimulationAmount] = useState(1000000); // 월 납입금액
  const [simulationPeriod, setSimulationPeriod] = useState(12); // 가입기간 (개월)

  // 상품 시각화 관련 상태
  const [productFeatures, setProductFeatures] = useState(null);
  const [preferentialRates, setPreferentialRates] = useState([]);
  const [simulationData, setSimulationData] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [qualificationStatus, setQualificationStatus] = useState(null);
  const [lastProductEnrollmentTime, setLastProductEnrollmentTime] =
    useState(null);
  // 로그인 게이트 및 고객 정보
  const [hasCustomerLoggedIn, setHasCustomerLoggedIn] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [pendingConsentData, setPendingConsentData] = useState(null);
  // 고객 로그인 모달 제거
  // 녹음 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  // 새로운 모달 시스템
  const [modals, setModals] = useState({
    privacyConsent: {
      isOpen: false,
      data: {
        title: "개인정보 수집·이용 동의서",
        content: "고객님의 개인정보를 수집·이용하는 것에 동의하시겠습니까?",
        fields: [
          { name: "생년월일", value: "1990-01-01" },
          { name: "연락처", value: "010-1234-5678" },
          { name: "주소", value: "서울시 강남구" },
        ],
      },
    },
    calculator: {
      isOpen: false,
      data: {},
    },
    simulation: {
      isOpen: false,
      data: {},
    },
    pdfViewer: {
      isOpen: false,
      data: {},
    },
    signaturePad: {
      isOpen: false,
      data: {},
    },
    productAnalysis: {
      isOpen: false,
      data: {},
    },
    productDetail: {
      isOpen: false,
      data: {},
    },
    enrollmentSuccess: {
      isOpen: false,
      data: {},
    },
  });

  // 모달 관리 함수들
  const openModal = (modalType, data = {}) => {
    console.log(`🔓 [태블릿] 모달 열기: ${modalType}`, data);
    setModals((prev) => {
      const newModals = {
        ...prev,
        [modalType]: {
          isOpen: true,
          data: data,
        },
      };
      console.log(`✅ [태블릿] 모달 상태 업데이트됨:`, newModals[modalType]);
      console.log(`🔍 [태블릿] 전체 모달 상태:`, newModals);
      return newModals;
    });
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: {
        isOpen: false,
        data: null,
      },
    }));
  };

  const handleModalAction = (modalType, action, data = null) => {
    console.log(`🎭 [태블릿] 모달 액션: ${modalType} - ${action}`, data);

    // 특별한 액션 처리
    if (modalType === "signaturePad" && action === "save") {
      console.log("🔐 [태블릿] 서명 저장 처리");
      handleSignatureSave(data);
    } else if (modalType === "privacyConsent" && action === "agree") {
      console.log("✅ [태블릿] 개인정보 동의 처리 시작");
      handlePrivacyConsentResponse(true);
    } else if (modalType === "privacyConsent" && action === "decline") {
      console.log("❌ [태블릿] 개인정보 동의 거부 처리 시작");
      handlePrivacyConsentResponse(false);
    } else {
      console.log(`🔍 [태블릿] 일반 모달 액션: ${modalType} - ${action}`);
    }

    // 백엔드로 액션 전송
    if (stompClient) {
      const message = {
        sessionId: sessionId,
        type: `${modalType}_${action}`,
        data: data,
        timestamp: new Date().toISOString(),
      };
      try {
        if (typeof stompClient.send === "function" && stompClient.connected) {
          stompClient.send("/app/tablet", {}, JSON.stringify(message));
        } else if (
          typeof stompClient.publish === "function" &&
          stompClient.active
        ) {
          stompClient.publish({
            destination: "/app/tablet",
            body: JSON.stringify(message),
          });
        } else {
          console.warn("STOMP client not ready; skipping send");
        }
      } catch (e) {
        console.error("Failed to send STOMP message", e);
      }
    }
  };

  // 인트로 완료 핸들러 (개인정보 동의 후 호출)
  const handleIntroComplete = () => {
    console.log("✅ [태블릿] handleIntroComplete 호출됨");
    console.log("🔍 [태블릿] 현재 showIntro 상태:", showIntro);
    console.log("🔍 [태블릿] 현재 currentPage:", currentPage);

    setShowIntro(false);
    setCurrentPage("welcome");

    console.log("✅ [태블릿] showIntro를 false로 설정 완료");
    console.log("✅ [태블릿] currentPage를 welcome으로 설정 완료");

    // 인트로 완료 시 개인정보 동의서 모달 표시
    console.log("📋 [태블릿] 인트로 완료 - 개인정보 동의서 모달 표시");
    openModal("privacyConsent", {
      title: "개인정보 수집·이용 동의서",
      content: "고객님의 개인정보를 수집·이용하는 것에 동의하시겠습니까?",
      fields: [
        { name: "생년월일", value: "1990-01-01" },
        { name: "연락처", value: "010-1234-5678" },
        { name: "주소", value: "서울시 강남구" },
      ],
    });

    // 모달 열기 후 상태 확인
    setTimeout(() => {
      console.log("🔍 [태블릿] 모달 열기 후 상태 확인");
    }, 100);

    // 인트로 완료 시, 고객 프로필이 있으면 로그인 상태로 설정
    if (customerProfile && !hasCustomerLoggedIn) {
      console.log("✅ [태블릿] 인트로 완료 - 보류된 로그인 활성화");
      setHasCustomerLoggedIn(true);
    }
  };

  // 광고 클릭 핸들러 (개인정보 동의서 표시)
  const handleAdClick = () => {
    console.log("🎯 [태블릿] 광고 클릭 - 개인정보 동의서 표시");
    // 개인정보 동의서 표시 로직
    // 동의 완료 후 handleIntroComplete 호출
    console.log("✅ [태블릿] 광고 완료 - 동의서 표시");
    const profile = customerProfile || {};
    const fieldsFromProfile = [
      profile.birth && { name: "생년월일", value: profile.birth },
      profile.phone && { name: "연락처", value: profile.phone },
      profile.address && { name: "주소", value: profile.address },
    ].filter(Boolean);

    // 기본 동의서 필드 설정
    const defaultConsentFields = [
      { name: "개인정보 수집·이용 동의", value: "동의", required: true },
      { name: "마케팅 정보 수신 동의", value: "동의", required: false },
      { name: "제3자 정보 제공 동의", value: "동의", required: false },
    ];

    openModal("privacyConsent", {
      title: "개인정보 수집·이용 동의서",
      content: "고객님의 개인정보를 수집·이용하는 것에 동의하시겠습니까?",
      fields: pendingConsentData?.fields || defaultConsentFields,
    });
    setPendingConsentData(null);
  };

  // 태블릿 상태 초기화 함수 (완전 초기화)
  const resetTabletState = (fullReset = false) => {
    console.log(
      "🔄 [태블릿] 상태 초기화 시작",
      fullReset ? "(완전 초기화)" : "(부분 초기화)"
    );

    if (fullReset) {
      // 필드 값들 초기화 (자동 채우기 정보는 유지)
      setFieldValues(() => autoFillEmployeeAndCustomerInfo({}));

      // 상품 관련 초기화
      setCurrentProduct(null);
      setProductFeatures(null);
      setPreferentialRates(null);
      setSimulationData(null);
      setEnrollmentData(null);
      setCustomerMatching(null);
      setConditionSelection(null);
      setProductDetails(null);

      // 하이라이트 초기화
      setHighlights([]);
    }

    // 입력 모드 초기화 (항상 실행)
    setIsFieldInputMode(false);
    setFocusedField(null);
    setHighlightedElement(null);

    // 서명 관련 초기화 (모달 시스템)
    closeModal("signaturePad");

    console.log("✅ [태블릿] 상태 초기화 완료");
  };

  // 서명 저장 함수 (새로운 모달 시스템용)
  const handleSignatureSave = (signatureData) => {
    console.log("✍️ [태블릿] 서명 저장:", signatureData);

    // fieldValues에 서명 데이터 저장 (dataURL 보관)
    if (signatureData.fieldId) {
      setFieldValues((prev) => ({
        ...prev,
        [signatureData.fieldId]: signatureData.signature || signatureData,
      }));
    }

    if (stompClient && sessionId && stompClient.connected) {
      // 1) 일반 필드 완료 프로토콜로도 전송 (기존 핸들러 재사용)
      if (signatureData.fieldId && signatureData.signature) {
        const fieldComplete = {
          type: "field-input-complete",
          data: {
            fieldId: signatureData.fieldId,
            value: signatureData.signature, // dataURL
            fieldName: signatureData.fieldLabel || "서명",
            timestamp: Date.now(),
          },
        };

        stompClient.publish({
          destination: `/topic/session/tablet_main`,
          body: JSON.stringify(fieldComplete),
        });

        console.log("📤 [태블릿] 서명 field-input-complete 메시지 전송:", {
          destination: `/topic/session/tablet_main`,
          message: fieldComplete,
          stompClientConnected: stompClient.connected,
          sessionId: "tablet_main",
        });
      }

      // 2) 서명 전용 이벤트도 함께 전송 (호환성)
      const signatureMessage = {
        type: "signature-completed",
        data: {
          fieldId: signatureData.fieldId,
          signature: signatureData.signature,
          timestamp: Date.now(),
        },
      };
      stompClient.publish({
        destination: `/topic/session/tablet_main`,
        body: JSON.stringify(signatureMessage),
      });

      console.log("📤 [태블릿] 서명 signature-completed 메시지 전송:", {
        destination: `/topic/session/tablet_main`,
        message: signatureMessage,
        stompClientConnected: stompClient.connected,
        sessionId: "tablet_main",
      });
    } else {
      console.error("❌ [태블릿] 서명 저장 시 WebSocket 연결 상태 오류:", {
        stompClient: !!stompClient,
        connected: stompClient?.connected,
        sessionId: sessionId,
      });
    }
  };
  const [privacyConsentProcessed, setPrivacyConsentProcessed] = useState(false);

  // useRef를 사용해서 최신 상태값 참조
  const privacyConsentProcessedRef = useRef(false);

  // privacyConsentProcessed 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    privacyConsentProcessedRef.current = privacyConsentProcessed;
    console.log(
      "🔄 [태블릿] privacyConsentProcessed ref 업데이트:",
      privacyConsentProcessed
    );
  }, [privacyConsentProcessed]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    activeTab: "comparison",
    principal: 1000000,
    rate: 3.5,
    period: 12,
    results: {
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
    },
  });

  // 중복 제거됨 - 아래 초기화 useEffect에서 처리

  // currentPage가 변경될 때마다 window.currentTabletPage 업데이트 및 저장
  useEffect(() => {
    window.currentTabletPage = currentPage;
    console.log("🔍 [태블릿] currentPage 변경됨:", currentPage);

    // 새로고침 후 복원을 위해 저장
    if (isInitialized) {
      localStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage, isInitialized]);

  // 고객 프로필 변경 시 저장
  useEffect(() => {
    if (isInitialized && customerProfile) {
      localStorage.setItem("customerProfile", JSON.stringify(customerProfile));
      console.log("💾 [태블릿] 고객 프로필 저장됨");
    }
  }, [customerProfile, isInitialized]);

  // 현재 상품 변경 시 저장
  useEffect(() => {
    if (isInitialized && currentProduct) {
      localStorage.setItem("currentProduct", JSON.stringify(currentProduct));
      console.log("💾 [태블릿] 현재 상품 저장됨");
    }
  }, [currentProduct, isInitialized]);

  // 필드 값들 변경 시 저장
  useEffect(() => {
    if (isInitialized && Object.keys(fieldValues).length > 0) {
      localStorage.setItem("fieldValues", JSON.stringify(fieldValues));
      console.log("💾 [태블릿] 필드 값들 저장됨");
    }
  }, [fieldValues, isInitialized]); // 마지막 상품 가입 메시지 처리 시간
  const [highlights, setHighlights] = useState([]); // 하이라이트 상태
  const [currentCustomer, setCurrentCustomer] = useState(null); // 현재 선택된 고객 정보
  const [currentTextIndex, setCurrentTextIndex] = useState(0); // 현재 표시할 텍스트 인덱스

  // 환영 메시지 텍스트 배열 (실제 고객 정보 사용)
  const getWelcomeTexts = () => {
    // 다양한 키 케이스(camelCase, snake_case, PascalCase) 대응
    const extractName = (obj) =>
      (
        obj?.customer?.name ||
        obj?.customerName ||
        obj?.customer_name ||
        obj?.Name ||
        obj?.name ||
        obj?.fullName ||
        obj?.full_name ||
        obj?.displayName ||
        obj?.display_name ||
        ""
      )
        .toString()
        .trim();

    // 로컬스토리지도 확인 (직원 PC에서 로그인 후 동기된 값)
    let storedProfile = {};
    try {
      storedProfile = JSON.parse(
        localStorage.getItem("customerProfile") || "{}"
      );
    } catch (_) {}

    const nameFromProfile = extractName(customerProfile);
    const nameFromCurrent = extractName(currentCustomer);
    const nameFromStorage = extractName(storedProfile);

    // placeholder(예: 'customername')나 빈 문자열 제거
    const normalize = (s) => (s && s.toLowerCase() !== "customername" ? s : "");

    const customerName =
      normalize(nameFromProfile) ||
      normalize(nameFromCurrent) ||
      normalize(nameFromStorage) ||
      "고객";
    return [
      `${customerName} 고객님 환영합니다`,
      "무엇을 도와드릴까요?",
      "스마트 상담을 시작해보세요",
      "AI가 도와드리겠습니다",
      "편리한 금융 서비스를 경험하세요",
    ];
  };

  const welcomeTexts = getWelcomeTexts();

  // 텍스트 번갈아 표시를 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % welcomeTexts.length);
    }, 2500); // 2.5초마다 변경

    return () => clearInterval(interval);
  }, []); // 의존성 배열을 빈 배열로 변경하여 무한 루프 방지

  // 고객 정보가 변경될 때 텍스트 인덱스 리셋 (임시 비활성화 - 무한 루프 방지)
  // useEffect(() => {
  //   setCurrentTextIndex(0);
  // }, [customerProfile?.name, currentCustomer?.name]);
  const [showProductDescription, setShowProductDescription] = useState(false); // 상품설명서 뷰어 표시 여부

  // 중복된 상태 선언들이 위쪽으로 이동됨 (61-75번 줄 참조)

  // 공통 필드 ID들 (자동 입력 대상)
  const commonFieldIds = [
    "customer_name",
    "resident_number",
    "phone_number",
    "address",
    "email",
    "occupation",
    "account_number",
  ];

  // 페이지 로드 시 로컬스토리지 초기화 및 상태 복원
  useEffect(() => {
    const initializeTablet = () => {
      try {
        // 폼 관련 캐시 데이터 완전 초기화
        localStorage.removeItem("testCustomer");
        localStorage.removeItem("testFormData");
        localStorage.removeItem("testFieldValues");
        localStorage.removeItem("fieldValues");
        localStorage.removeItem("currentForm");
        localStorage.removeItem("currentFormIndex");
        localStorage.removeItem("formProgress");
        localStorage.removeItem("enrollmentData");

        console.log("✅ [태블릿] 폼 관련 캐시 데이터 완전 초기화 완료");

        // 로컬스토리지에서 상태 복원 시도
        try {
          const savedCustomerProfile = localStorage.getItem("customerProfile");
          if (savedCustomerProfile) {
            const profile = JSON.parse(savedCustomerProfile);
            setCustomerProfile(profile);
            setHasCustomerLoggedIn(true);
            console.log("📋 [태블릿] 고객 프로필 복원됨:", profile.name);
          }

          const savedCurrentProduct = localStorage.getItem("currentProduct");
          if (savedCurrentProduct) {
            const product = JSON.parse(savedCurrentProduct);
            setCurrentProduct(product);
            console.log(
              "🏦 [태블릿] 현재 상품 복원됨:",
              product.productName || product.ProductName
            );
          }

          const savedFieldValues = localStorage.getItem("fieldValues");
          if (savedFieldValues) {
            const values = JSON.parse(savedFieldValues);
            setFieldValues(values);
            console.log("📝 [태블릿] 필드 값들 복원됨");
          }

          const savedCurrentPage = localStorage.getItem("currentPage");
          if (savedCurrentPage && savedCurrentPage !== "welcome") {
            setCurrentPage(savedCurrentPage);
            console.log("📄 [태블릿] 페이지 상태 복원됨:", savedCurrentPage);
          }
        } catch (error) {
          console.warn("⚠️ [태블릿] 상태 복원 중 일부 오류 (무시됨):", error);
        }

        // 초기화 완료 표시
        setIsInitialized(true);

        // 전역 변수 초기화
        window.currentTabletPage = currentPage || "welcome";
      } catch (error) {
        console.error("❌ [태블릿] 초기화 중 오류 발생:", error);
        setIsInitialized(true); // 오류가 발생해도 초기화 완료로 처리
      }
    };

    initializeTablet();
  }, [currentPage]);

  // 필드 입력 모드 상태 변경 감지
  useEffect(() => {
    console.log("🔄 [태블릿] isFieldInputMode 상태 변경:", isFieldInputMode);
    console.log("🔄 [태블릿] focusedField 상태 변경:", focusedField);
  }, [isFieldInputMode, focusedField]);

  useEffect(() => {
    // 초기화가 완료된 후에만 WebSocket 연결 시작
    if (!isInitialized) {
      console.log("⏳ [태블릿] 초기화 대기 중...");
      return;
    }

    // PWA에서 네트워크 상태 변화 감지
    const handleOnline = () => {
      console.log("🌐 [태블릿] 네트워크 연결됨 - WebSocket 재연결 시도");
      if (!connected && stompClient) {
        setTimeout(() => {
          if (stompClient && !stompClient.connected) {
            stompClient.activate();
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log("📴 [태블릿] 네트워크 연결 끊김");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isInitialized, connected, stompClient]);

  useEffect(() => {
    // 초기화가 완료된 후에만 WebSocket 연결 시작
    if (!isInitialized) {
      console.log("⏳ [태블릿] 초기화 대기 중...");
      return;
    }

    console.log("🚀 [태블릿] 컴포넌트 마운트 - WebSocket 연결 시작");

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      console.log("🔌 [태블릿] WebSocket 연결 시작...");
      const client = new Client({
        webSocketFactory: () =>
          new SockJS("/api/ws", null, {
            transports: ["websocket", "xhr-polling"], // iframe 제외
            timeout: 10000, // PWA에서 타임아웃 증가
            debug: false,
            heartbeat_delay: 25000, // PWA에서 하트비트 간격 증가
            disconnect_delay: 5000,
          }),
        debug: function (str) {
          if (process.env.NODE_ENV === "development") {
            console.log("🔍 [태블릿] STOMP Debug:", str);
          }
        },
        heartbeatIncoming: 40000, // PWA에서 하트비트 수신 간격 증가
        heartbeatOutgoing: 40000, // PWA에서 하트비트 송신 간격 증가
        reconnectDelay: 5000, // PWA에서 재연결 지연 시간 증가
        onConnect: (frame) => {
          console.log("✅ [태블릿] WebSocket 연결 성공:", {
            frame: frame,
            sessionId: sessionId,
            connected: client.connected,
          });
          setConnected(true);
          setStompClient(client);
          reconnectAttempts = 0; // 연결 성공 시 재연결 시도 횟수 리셋

          // PWA에서 네트워크 상태 감지
          if ("serviceWorker" in navigator) {
            console.log(
              "📱 [태블릿] PWA 환경 감지 - 네트워크 상태 모니터링 시작"
            );
          }

          // 태블릿 세션 참여
          const joinMessage = {
            sessionId: sessionId,
            userType: "tablet",
            employeeId: employeeId,
            timestamp: Date.now(),
          };

          try {
            client.publish({
              destination: "/app/join-session",
              body: JSON.stringify(joinMessage),
            });

            client.subscribe(`/topic/session/${sessionId}`, (message) => {
              try {
                const data = JSON.parse(message.body);
                if (process.env.NODE_ENV === "development") {
                  console.log("📨 [태블릿] 메시지 수신:", data.type);
                }
                handleWebSocketMessage(data);
              } catch (error) {
                console.error("❌ [태블릿] 메시지 파싱 오류:", error);
              }
            });
          } catch (error) {
            console.error("❌ [태블릿] 세션 참여 중 오류:", error);
          }
        },
        onStompError: (frame) => {
          console.error("❌ [태블릿] WebSocket 연결 오류:", frame);
          setConnected(false);

          // 재연결 시도
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              30000
            );
            console.log(
              `🔄 [태블릿] ${delay}ms 후 재연결 시도 (${reconnectAttempts}/${maxReconnectAttempts})`
            );
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        },
        onWebSocketClose: () => {
          console.log("🔌 [태블릿] WebSocket 연결 종료");
          setConnected(false);

          // 재연결 시도
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              30000
            );
            console.log(
              `🔄 [태블릿] ${delay}ms 후 재연결 시도 (${reconnectAttempts}/${maxReconnectAttempts})`
            );
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        },
      });

      client.activate();
    };

    connectWebSocket();

    return () => {
      console.log("🔌 [태블릿] 컴포넌트 언마운트 - WebSocket 연결 종료");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [isInitialized]);

  const handleWebSocketMessage = (data) => {
    // 개인정보 동의가 완료되지 않았으면 대부분의 메시지를 보류하되, 연결/로그인 관련 핵심 메시지는 통과시킴
    if (!privacyConsentProcessedRef.current) {
      const allowedDuringIntro = new Set([
        "customer-login-start",
        "customer-login",
        "tablet-connected",
        "participant-joined",
      ]);
      if (!allowedDuringIntro.has(data.type)) {
        if (data.type === "privacy-consent") {
          setPendingConsentData(data);
        }
        return;
      }
    }

    // 상품 가입 중이거나 최근에 상품 가입 메시지가 처리된 경우 페이지 변경 메시지 차단
    const now = Date.now();
    const isEnrollmentActive =
      currentPage === "product-enrollment" ||
      (lastProductEnrollmentTime && now - lastProductEnrollmentTime < 30000) || // 30초로 연장
      window.currentTabletPage === "product-enrollment"; // 전역 변수도 확인

    // 상품 가입 중일 때는 모든 페이지 변경 메시지를 차단
    if (isEnrollmentActive) {
      const pageChangeMessages = [
        "product-visualization-sync",
        "product-detail-sync",
        "product-selected",
        "product-detail",
        "screen-updated",
      ];

      if (
        pageChangeMessages.includes(data.type) ||
        (data.type === "screen-updated" &&
          data.data &&
          pageChangeMessages.includes(data.data.type))
      ) {
        return;
      }
    }

    switch (data.type) {
      case "customer-info-update":
        if (data.data) {
          // 광고 중이거나 로그인 전이면 모달 표시 금지
          if (showIntro || !hasCustomerLoggedIn) {
            break;
          }
          // 고객에게 보여주기: 모달로 안내만 표시
          openModal("privacyConsent", {
            title: "고객 정보 확인",
            content: `${
              data.data.customer?.name || ""
            } 고객님의 정보가 갱신되었습니다.`,
            fields: [
              { name: "고객명", value: data.data.customer?.name || "-" },
              { name: "고객번호", value: data.data.customer?.id || "-" },
            ],
          });
        } else {
        }
        break;

      case "product-selected":
        if (data.data && data.data.product) {
          setCurrentProduct(data.data.product);
          setCurrentPage("product-detail");
        }
        break;

      case "product-detail-sync":
        if (data.data) {
          // 현재 상품 가입 중이면 페이지 변경하지 않음
          if (currentPage === "product-enrollment") {
            return;
          }

          // 상품 데이터 추출 (중첩된 구조 처리)
          const productData = data.data.product || data.data._raw || data.data;

          setCurrentProduct(productData);

          setCurrentPage("product-detail");
          // 상품 상세보기에서는 서식 관련 상태 초기화
          setCurrentFormIndex(0);
        }
        break;

      case "calculator-open":
        openModal("calculator", data.data || {});
        break;

      case "calculator-close":
        closeModal("calculator");
        break;

      case "calculator-update":
        setCalculatorData((prevData) => ({
          ...prevData,
          ...data.data,
        }));
        // 계산기 모달 열기
        openModal("calculator", data.data);

        break;

      case "calculator-sync":
        setCalculatorData((prevData) => ({
          ...prevData,
          ...data.data,
        }));
        // 계산기 모달 열기
        openModal("calculator", data.data);

        break;

      // 혜택 시뮬레이션 관련 메시지 처리 제거됨

      // PDF 관련 기능 제거됨

      case "product-enrollment":
        console.log(
          "🔍 [태블릿] 상품 가입 데이터 상세:",
          JSON.stringify(data.data, null, 2)
        );

        if (data.data) {
          // 상품 정보 설정 (data.data에 직접 상품 정보가 있음)
          const productInfo = {
            productId: data.data.productId,
            productName: data.data.productName,
            productType: data.data.productType,
            customerId: data.data.customerId,
          };
          setCurrentProduct(productInfo);

          // 서식 정보 설정
          if (data.data.forms && data.data.forms.length > 0) {
            setCurrentForm(data.data.forms[0]); // 첫 번째 서식으로 설정
            setCurrentFormIndex(0);
          } else {
          }

          // 상품 가입 페이지로 이동
          setCurrentPage("product-enrollment");
          setLastProductEnrollmentTime(Date.now());
          window.currentTabletPage = "product-enrollment";
        }
        break;

      case "ai-recommendation":
        handleAIRecommendationMessage(data);
        break;

      case "ai-recommendations":
        handleAIRecommendationMessage(data);
        break;

      case "show-application-form":
        if (data.data && data.data.product) {
          // 상품 정보 설정
          setCurrentProduct(data.data.product);

          // API 호출로 폼 데이터 조회
          // 실제 상품 ID 사용 (URL 인코딩 처리)
          const productId =
            data.data.product?.productId || data.data.product?.id || "P001";

          fetch(getApiUrl(`/api/forms/byProductId/${productId}`))
            .then((response) => {
              if (response.ok) {
                return response.json();
              }
              throw new Error(`API 호출 실패: ${response.status}`);
            })
            .then((apiData) => {
              if (
                apiData.data &&
                Array.isArray(apiData.data) &&
                apiData.data.length > 0
              ) {
                // API에서 받은 첫 번째 폼 사용
                const apiForm = apiData.data[0];
                setCurrentForm(apiForm);
                setCurrentFormIndex(0);
              } else {
                console.log(
                  "⚠️ [태블릿] API 응답에 데이터가 없음, 기본 폼 사용"
                );
              }

              // 상품 가입 페이지로 이동
              setCurrentPage("product-enrollment");
              setLastProductEnrollmentTime(Date.now());
              window.currentTabletPage = "product-enrollment";
            })
            .catch((error) => {
              // API 호출 실패 시 기본 폼 사용
              const dummyForm = {
                formId: "consent_form",
                formName: "개인정보 수집·이용 동의서",
                formType: "consent",
                isReactForm: true,
                isHtmlForm: false,
                formSchema: {
                  fields: [
                    {
                      id: "customer_name",
                      name: "고객명",
                      type: "text",
                      required: true,
                    },
                    {
                      id: "customer_id",
                      name: "주민등록번호",
                      type: "text",
                      required: true,
                    },
                    {
                      id: "phone",
                      name: "연락처",
                      type: "text",
                      required: true,
                    },
                    {
                      id: "address",
                      name: "주소",
                      type: "text",
                      required: true,
                    },
                    {
                      id: "consent_agree",
                      name: "개인정보 수집·이용 동의",
                      type: "checkbox",
                      required: true,
                    },
                    {
                      id: "consentDate",
                      name: "동의일자",
                      type: "date",
                      required: true,
                    },
                    {
                      id: "signature",
                      name: "서명",
                      type: "signature",
                      required: true,
                    },
                  ],
                },
              };

              setCurrentForm(dummyForm);
              setCurrentFormIndex(0);

              // 상품 가입 페이지로 이동
              setCurrentPage("product-enrollment");
              setLastProductEnrollmentTime(Date.now());
              window.currentTabletPage = "product-enrollment";
            });
        }
        break;

      case "product-analysis":
        console.log(
          "🔍 [태블릿] 상품 비교분석 데이터 상세:",
          JSON.stringify(data.data, null, 2)
        );

        if (data.data) {
          // 상품 비교분석 모달 열기 - 데이터 구조 맞춤
          const modalData = {
            selectedProducts:
              data.data.products || data.data.selectedProducts || [],
            product: data.data.customerProduct || data.data.product,
            simulationAmount: data.data.simulationAmount || 1000000,
            simulationPeriod: data.data.simulationPeriod || 12,
          };

          console.log(
            "🔍 [태블릿] openModal 호출 전 모달 상태:",
            modals.productAnalysis
          );
          openModal("productAnalysis", modalData);

          // 상태 업데이트 후 확인
          setTimeout(() => {
            console.log(
              "🔍 [태블릿] openModal 호출 후 모달 상태:",
              modals.productAnalysis
            );
          }, 100);
        }
        break;

      case "product-analysis-close":
        closeModal("productAnalysis");

        break;

      case "show-comparison":
        console.log(
          "🔍 [태블릿] 상품 비교분석 데이터 상세:",
          JSON.stringify(data.data, null, 2)
        );

        if (data.data) {
          // 상품 비교분석 모달 열기 - 데이터 구조 맞춤
          const modalData = {
            selectedProducts:
              data.data.products || data.data.selectedProducts || [],
            product: data.data.customerProduct || data.data.product,
            simulationAmount: data.data.simulationAmount || 1000000,
            simulationPeriod: data.data.simulationPeriod || 12,
          };

          console.log(
            "🔍 [태블릿] openModal 호출 전 모달 상태:",
            modals.productAnalysis
          );
          openModal("productAnalysis", modalData);

          // 상태 업데이트 후 확인
          setTimeout(() => {
            console.log(
              "🔍 [태블릿] openModal 호출 후 모달 상태:",
              modals.productAnalysis
            );
          }, 100);
        }
        break;

      case "product-detail-modal":
        if (data.data && data.data.product) {
          // 상품 상세 정보 모달 열기
          openModal("productDetail", data.data);
        }
        break;

      case "product-detail-modal-close":
        closeModal("productDetail");

        break;

      // case "field-input-completed": // 중복 제거 - 아래에서 처리

      case "product-features-sync":
        if (data.features) {
          setProductFeatures(data.features);
        }
        break;

      case "preferential-rates-sync":
        if (data.rates) {
          setPreferentialRates(data.rates);
        }
        break;

      // simulation-sync 메시지 처리 제거됨

      case "enrollment-sync":
        if (data.enrollment) {
          setEnrollmentData(data.enrollment);
        }
        break;

      case "customer-matching-sync":
        if (data.matching) {
          setCustomerMatching(data.matching);
        }
        break;

      case "condition-selection-sync":
        if (data.conditionSelection) {
          setConditionSelection(data.conditionSelection);
        }
        break;

      case "product-details-sync":
        if (data.productDetails) {
          setProductDetails(data.productDetails);
        }
        break;

      case "form-navigation":
        if (data.data) {
          const {
            currentFormIndex: newFormIndex,
            currentForm,
            totalForms,
          } = data.data;
          console.log("🔍 [태블릿] 서식 변경 정보:", {
            newFormIndex,
            currentForm: currentForm ? currentForm.formName : "없음",
            totalForms,
            currentPage,
          });

          if (newFormIndex !== undefined) {
            console.log(
              "🔄 [태블릿] 서식 인덱스 변경:",
              currentFormIndex,
              "→",
              newFormIndex
            );
            setCurrentFormIndex(newFormIndex);

            // 서식 변경 시 입력 모드만 초기화 (필드 값은 유지)
            setIsFieldInputMode(false);
            setFocusedField(null);
            closeModal("signaturePad");

            // 서식 타입에 따라 페이지 전환
            if (currentForm) {
              if (currentForm.formType === "consent") {
              } else if (currentForm.formType === "application") {
              } else if (currentForm.formType === "electronic_finance") {
              } else if (currentForm.formType === "financial_purpose") {
              }
            }
          } else {
          }
        } else {
        }
        break;

      case "test-connection":
        break;

      case "STT_TRANSCRIPT":
        console.log(
          "🎤 STT 음성 인식 결과:",
          data.transcript,
          "화자:",
          data.speaker
        );
        // STT 결과를 화면에 표시하거나 처리
        if (data.transcript) {
          const speakerName = data.speaker === "employee" ? "행원" : "고객";

          // 필요시 상태 업데이트나 UI 표시 로직 추가
        }
        break;

      case "screen-updated":
        // screen-updated 메시지 내부의 실제 데이터를 처리
        if (data.data && data.data.type) {
          console.log(
            "🔍 [태블릿] lastProductEnrollmentTime:",
            lastProductEnrollmentTime
          );

          // 상품 가입 중이면 시각화 동기화 메시지 무시
          if (
            data.data.type === "product-visualization-sync" &&
            currentPage === "product-enrollment"
          ) {
            console.log(
              "⚠️ [태블릿] 상품 가입 중이므로 screen-updated 내부 시각화 동기화 무시"
            );
            return;
          }

          // product-enrollment 메시지가 최근에 처리되었다면 시각화 동기화 무시
          if (
            data.data.type === "product-visualization-sync" &&
            lastProductEnrollmentTime
          ) {
            const now = Date.now();
            if (now - lastProductEnrollmentTime < 5000) {
              console.log(
                "⚠️ [태블릿] 최근 상품 가입 메시지 처리 후 5초 이내이므로 screen-updated 내부 시각화 동기화 무시"
              );
              return;
            }
          }

          // 재귀 호출 대신 직접 처리하여 무한 루프 방지
          const innerData = data.data;

          switch (innerData.type) {
            case "product-visualization-sync":
              // product-visualization-sync를 직접 처리
              console.log(
                "🔍 [태블릿] screen-updated 내부 product-visualization-sync 직접 처리"
              );
              // innerData.data에 실제 데이터가 있으므로 이를 전달
              if (innerData.data) {
                handleWebSocketMessage({
                  type: innerData.type,
                  data: innerData.data,
                });
              }
              break;
            case "field-focus":
              // field-focus를 직접 처리
              console.log(
                "🔍 [태블릿] screen-updated 내부 field-focus 직접 처리"
              );
              handleWebSocketMessage(innerData);
              break;
            // PDF 관련 기능 제거됨
            default:
              console.log(
                "🔍 [태블릿] screen-updated 내부 메시지 타입:",
                innerData.type
              );
              break;
          }
        }
        break;

      case "product-visualization-sync":
        if (data.data) {
          // 현재 상품 가입 중이면 페이지 변경하지 않음
          if (currentPage === "product-enrollment") {
            return;
          }

          // product-enrollment 메시지가 최근에 처리되었다면 무시
          const now = Date.now();
          if (
            lastProductEnrollmentTime &&
            now - lastProductEnrollmentTime < 5000
          ) {
            console.log(
              "⚠️ 최근 상품 가입 메시지 처리 후 5초 이내이므로 시각화 동기화 무시"
            );
            return;
          }

          // 상품 데이터 처리
          const productData = data.data;

          if (productData) {
            // 상품 기본 정보 설정
            setCurrentProduct(productData);

            // 상품 특징 정보 설정
            if (productData.productData) {
              setProductFeatures(productData.productData);
            }

            // 우대금리 정보 설정
            if (productData.preferentialConditions) {
              setPreferentialRates(productData.preferentialConditions);
            }

            // 시뮬레이션 데이터 설정
            if (productData.monthlyData || productData.comparisonData) {
              setSimulationData({
                monthlyData: productData.monthlyData,
                comparisonData: productData.comparisonData,
                simulationAmount: productData.simulationAmount || 1000000,
                simulationPeriod: productData.simulationPeriod || 12,
              });
            }

            // 자격 조건 상태 설정
            setQualificationStatus({
              canEnroll:
                productData.customerData?.hasSalaryAccount ||
                productData.customerData?.isNewCustomer,
              finalRate: productData.calculatedRate || 2.0,
            });
          }
        }
        break;

      case "field-focus":
        // 필드 타입 확인
        const fieldType = data.data?.fieldType || data.fieldType || "text";

        // 서명 필드인 경우 서명 패드 열기
        if (fieldType === "signature") {
          const fieldId = data.data?.fieldId || data.fieldId;
          const fieldLabel = data.data?.fieldLabel || data.fieldLabel || "서명";

          // 새로운 모달 시스템으로 서명 패드 표시
          openModal("signaturePad", {
            fieldId: fieldId,
            fieldLabel: fieldLabel,
          });

          break;
        }

        // 하이라이트와 동일한 방식으로 처리 - data.data에서 필드 정보 추출
        if (data.data && data.data.fieldId) {
          const fieldData = {
            fieldId: data.data.fieldId,
            fieldName: data.data.fieldName || data.data.fieldId,
            fieldLabel: data.data.fieldLabel,
            fieldType: data.data.fieldType || "text",
            fieldPlaceholder:
              data.data.fieldPlaceholder ||
              `${data.data.fieldLabel}을(를) 입력해주세요`,
            formIndex: data.data.formIndex || 0,
            formName: data.data.formName || "개인정보 수집·이용 동의서",
          };

          console.log(
            "✅ [태블릿] 필드 데이터 추출 성공 (data.data):",
            fieldData
          );

          setFocusedField(fieldData);
          setIsFieldInputMode(true);
          console.log(
            "✅ [태블릿] 필드 입력 모드 활성화:",
            fieldData.fieldLabel
          );
        } else if (data.fieldId && data.fieldLabel) {
          // 백업: 직접 필드 정보가 있는 경우
          const fieldData = {
            fieldId: data.fieldId,
            fieldName: data.fieldName || data.fieldId,
            fieldLabel: data.fieldLabel,
            fieldType: data.fieldType || "text",
            fieldPlaceholder:
              data.fieldPlaceholder || `${data.fieldLabel}을(를) 입력해주세요`,
            formIndex: data.formIndex || 0,
            formName: data.formName || "개인정보 수집·이용 동의서",
          };

          setFocusedField(fieldData);
          setIsFieldInputMode(true);
          console.log(
            "✅ [태블릿] 필드 입력 모드 활성화:",
            fieldData.fieldLabel
          );
        } else {
        }
        break;

      case "field-input-sync":
        // 실시간 동기화는 처리하지 않고 로그만 출력
        console.log("📝 실시간 필드 동기화:", {
          fieldId: data.data?.fieldId,
          value: data.data?.value,
          fieldName: data.data?.fieldName,
        });
        break;

      case "field-input-completed":
        // 백엔드에서 직접 필드 정보를 전달하므로 data.data가 아닌 직접 접근
        const inputFieldId = data.fieldId || (data.data && data.data.fieldId);
        const inputFieldValue =
          data.fieldValue || (data.data && data.data.fieldValue);

        if (inputFieldId && inputFieldValue !== undefined) {
          // 중복 필드 자동 채우기
          const updatedValues = autoFillDuplicateFields(
            fieldValues,
            inputFieldId,
            inputFieldValue
          );

          setFieldValues(updatedValues);
        }
        break;

      case "enrollment-completed":
        // 가입 완료 모달 표시
        const enrollmentData = {
          customerName: data.data?.customerName || "고객님",
          productName: data.data?.productName || "하나금융상품",
          submissionId: data.data?.submissionId || `SUB_${Date.now()}`,
          completionDate: new Date().toLocaleDateString("ko-KR"),
          completionTime: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        openModal("enrollmentSuccess", enrollmentData);

        // 상품 가입 완료 시 메인 대시보드로 돌아가기
        setCurrentPage("welcome");
        setCurrentProduct(null);
        setCurrentForm(null);
        setCurrentFormIndex(0);
        resetTabletState(true); // 완전 초기화
        setFocusedField(null);
        // 전역 변수 초기화
        window.currentTabletPage = "welcome";
        setLastProductEnrollmentTime(null);

        break;

      case "tab-change":
        if (data.data && data.data.activeTab) {
          const newTab = data.data.activeTab;

          // 탭에 따라 태블릿 페이지 변경
          switch (newTab) {
            case "dashboard":
              setCurrentPage("welcome"); // 메인 대시보드는 웰컴 페이지로
              resetTabletState(true); // 완전 초기화
              break;
            case "customer":
              setCurrentPage("recommendations");
              resetTabletState(true); // 완전 초기화
              break;
            case "products":
              // 상품 탐색 탭이면 현재 상품이 있으면 상품 상세 페이지 유지, 없으면 웰컴 페이지
              if (currentProduct) {
                setCurrentPage("product-detail");
              } else {
                setCurrentPage("welcome");
                resetTabletState(true); // 완전 초기화
              }
              break;
            case "forms":
            case "pdf-forms":
              // 서식 작성 탭이면 상품 가입 페이지로 이동

              // enrollmentData가 있으면 사용
              if (data.data && data.data.enrollmentData) {
                console.log(
                  "✅ [태블릿] enrollmentData 사용하여 상품 가입 페이지 설정"
                );
                const enrollmentData = data.data.enrollmentData;

                // 상품 정보 설정
                if (enrollmentData.productId) {
                  setCurrentProduct({
                    productId: enrollmentData.productId,
                    product_name: enrollmentData.productName,
                    product_type: enrollmentData.productType,
                  });
                }

                // 서식 정보 설정
                if (enrollmentData.forms && enrollmentData.forms.length > 0) {
                  setCurrentForm(enrollmentData.forms[0]);
                  setCurrentFormIndex(0);
                  console.log(
                    "✅ [태블릿] 서식 정보 설정됨:",
                    enrollmentData.forms[0]
                  );
                }

                setCurrentPage("product-enrollment");
                setLastProductEnrollmentTime(Date.now());
                window.currentTabletPage = "product-enrollment";
                console.log(
                  "✅ [태블릿] forms 탭 - enrollmentData로 상품 가입 페이지 설정 완료"
                );
              } else if (currentProduct) {
                setCurrentPage("product-enrollment");
                console.log(
                  "✅ [태블릿] forms 탭 - 기존 상품으로 상품 가입 페이지로 이동"
                );
              } else {
                setCurrentPage("welcome");
                resetTabletState(true); // 완전 초기화
                console.log(
                  "⚠️ [태블릿] forms 탭 - 상품이 없어서 웰컴 페이지로 이동"
                );
              }
              break;
            // simulation 케이스 제거됨
            case "ai":
            case "banking":
              // 기타 탭들은 웰컴 페이지로
              setCurrentPage("welcome");
              resetTabletState(true); // 완전 초기화
              break;
            case "history":
              // 고객 이력 페이지로 이동
              setCurrentPage("customer-history");
              break;
            default:
              setCurrentPage("welcome");
              resetTabletState(true); // 완전 초기화
              break;
          }
        }
        break;

      case "field-values-sync":
        if (data.data) {
          const { fieldValues: syncedFieldValues, updatedField } = data.data;

          // PC에서 받은 필드 값들로 태블릿 상태 동기화
          setFieldValues(syncedFieldValues);
        }
        break;

      case "product-description":
        if (data.data?.product) {
          // 상품설명서 뷰어 표시 로직 추가
          setCurrentProduct(data.data.product);
          setCurrentPage(data.data.currentPage || 1);
          // 상품설명서는 페이지 전환으로 렌더링 유지. 모달이 아님
          // 페이지 변경 시 하이라이트 초기화 (주석 처리하여 하이라이트 유지)
          // setHighlights([]);
        }
        break;

      case "product-recommendation":
        if (data.data?.product) {
          // 상품 추천 페이지로 전환
          setCurrentPage("product-recommendation");
          setCurrentProduct(data.data.product);
        }
        break;

      case "screen-highlight":
        if (data.data?.highlight) {
          const highlight = data.data.highlight;

          setHighlights((prev) => {
            const updated = [...prev, highlight];

            return updated;
          });
        } else {
        }
        break;

      // product-simulation 케이스 제거됨

      case "product-description-close":
        console.log("🔍 현재 상태:", {
          showProductDescription,
          currentProduct: !!currentProduct,
          currentPage,
        });
        // 상품설명서 종료
        setCurrentProduct(null);
        setCurrentPage("welcome");
        resetTabletState(true); // 완전 초기화

        break;

      case "privacy-consent": {
        // 로그인 전이면 보류 후, 로그인 시점에 표시
        if (showIntro || !hasCustomerLoggedIn) {
          setPendingConsentData(data);
          break;
        }

        // 로그인되어 있으면 고객 프로필을 활용해 동의서 필드 구성
        const profile = customerProfile || {};
        const fieldsFromProfile = [
          profile.birth && { name: "생년월일", value: profile.birth },
          profile.phone && { name: "연락처", value: profile.phone },
          profile.address && { name: "주소", value: profile.address },
        ].filter(Boolean);

        openModal("privacyConsent", {
          title: "개인정보 수집·이용 동의서",
          content: "고객님의 개인정보를 수집·이용하는 것에 동의하시겠습니까?",
          fields: data.fields || fieldsFromProfile,
        });
        break;
      }

      case "customer-login-start": {
        // 모달 사용하지 않음
        break;
      }

      case "customer-info-display": {
        // 고객 정보를 currentCustomer에 저장
        const customerData =
          data.data?.customer || data.customer || data.data || {};

        setCurrentCustomer(customerData);
        setCustomerProfile(customerData);
        setHasCustomerLoggedIn(true);

        // 고객 이력 페이지로 이동
        setCurrentPage("customer-history");

        console.log(
          "✅ [태블릿] 고객 정보 설정 및 이력 페이지 이동 완료:",
          customerData
        );
        break;
      }

      case "customer-login": {
        console.log(
          "🔍 [태블릿] 전체 메시지 구조:",
          JSON.stringify(data, null, 2)
        );

        // 다양한 페이로드 형태 대응
        const profile = data.data?.customer || data.customer || data.data || {};

        setCustomerProfile(profile);
        setHasCustomerLoggedIn(true);
        // 모달 사용하지 않음

        // 보류 중인 동의서가 있으면 즉시 표시
        if (pendingConsentData) {
          const fieldsFromProfile = [
            profile.birth && { name: "생년월일", value: profile.birth },
            profile.phone && { name: "연락처", value: profile.phone },
            profile.address && { name: "주소", value: profile.address },
          ].filter(Boolean);
          openModal("privacyConsent", {
            title: "개인정보 수집·이용 동의서",
            content: "고객님의 개인정보를 수집·이용하는 것에 동의하시겠습니까?",
            fields: pendingConsentData.fields || fieldsFromProfile,
          });
          setPendingConsentData(null);
        }
        break;
      }

      case "recording-start": {
        setIsRecording(true);
        break;
      }

      case "recording-stop": {
        setIsRecording(false);
        break;
      }

      case "simulation-sync": {
        if (data.data) {
          // 시뮬레이션 데이터 처리
          setSimulationData(data.data);

          // 차트 표시 상태 동기화
          if (data.data.chartData?.showChart !== undefined) {
            setShowChart(data.data.chartData.showChart);
            console.log(
              "📈 [태블릿] 차트 표시 상태 동기화:",
              data.data.chartData.showChart
            );
          }

          // 시뮬레이션 모달이 열려있다면 데이터 업데이트
          if (modals.simulation?.isOpen) {
          }
        }
        break;
      }

      case "reset-to-main":
        setCurrentPage("welcome");
        resetTabletState(true);
        break;

      default:
        break;
    }
  };

  // 개인정보 동의서 처리 함수
  const handlePrivacyConsentResponse = (consentGiven) => {
    // 모달 즉시 닫기 (새 시스템)
    closeModal("privacyConsent");

    // 개인정보 동의 완료 시 showIntro를 false로 설정
    if (consentGiven) {
      setShowIntro(false);
    }

    // 처리 완료 플래그 설정 (재귀 방지)
    setPrivacyConsentProcessed(true);

    // 직원 PC로 동의 응답 전송 (간단한 boolean 값)
    if (stompClient && stompClient.connected) {
      const messageBody = {
        sessionId: "tablet_main",
        type: "privacy-consent",
        consentGiven: consentGiven, // 간단한 boolean 값
        data: {
          consentGiven: consentGiven,
        },
      };

      stompClient.publish({
        destination: "/app/send-to-session",
        body: JSON.stringify(messageBody),
      });
    }
  };

  // 고객 로그인 핸들러
  const handleCustomerLogin = (customerData) => {
    setCustomerProfile(customerData);
    setHasCustomerLoggedIn(true);

    // 로컬스토리지에 고객 정보 저장
    localStorage.setItem("customerProfile", JSON.stringify(customerData));
  };

  const renderRecommendationsPage = () => {
    const customerProfile = JSON.parse(
      localStorage.getItem("customerProfile") || "{}"
    );
    const customerId = customerProfile.customerId || "default";
    const customerName = customerProfile.name || "고객";

    return (
      <ProductRecommendationDashboard
        customerId={customerId}
        customerName={customerName}
      />
    );
  };

  const renderWelcomePage = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 30%, #86efac 50%, #bbf7d0 70%, #dcfce7 85%, #f0fdf4 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 메인 콘텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          background: "#ffffff",
        }}
      >
        {/* 모서리 장식 요소 */}
        {/* 좌상단 */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            width: "120px",
            height: "120px",
            border: "4px solid #00c73c",
            borderRight: "none",
            borderBottom: "none",
            borderRadius: "40px 0 0 0",
          }}
        />
        {/* 우상단 */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            width: "120px",
            height: "120px",
            border: "4px solid #00c73c",
            borderLeft: "none",
            borderBottom: "none",
            borderRadius: "0 40px 0 0",
          }}
        />
        {/* 좌하단 */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "30px",
            width: "120px",
            height: "120px",
            border: "4px solid #00c73c",
            borderRight: "none",
            borderTop: "none",
            borderRadius: "0 0 0 40px",
          }}
        />
        {/* 우하단 */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "30px",
            width: "120px",
            height: "120px",
            border: "4px solid #00c73c",
            borderLeft: "none",
            borderTop: "none",
            borderRadius: "0 0 40px 0",
          }}
        />

        {/* 녹음 상태 표시 (상단) */}
        {isRecording && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#fff5f5",
              padding: "8px 16px",
              borderRadius: "15px",
              border: "2px solid #ff6b6b",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite 0.2s",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite 0.4s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.9rem",
                color: "#ff6b6b",
                fontWeight: "600",
              }}
            >
              🎤 녹음중
            </span>
          </div>
        )}

        {/* 로고 */}
        <div
          style={{
            marginBottom: "80px",
            marginTop: "60px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            animation: "logoFloat 3s ease-in-out infinite",
          }}
        >
          <img
            src="/logo.png"
            alt="Banker Advisor"
            style={{
              maxWidth: "400px",
              height: "auto",
            }}
            onError={(e) => {
              // PNG 로고가 로드되지 않으면 텍스트 로고로 대체
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{
              display: "none",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                color: "#00c73c",
                lineHeight: 1,
                margin: 0,
              }}
            >
              Banker
            </div>
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "600",
                color: "#1e3a8a",
                lineHeight: 1,
                margin: 0,
                marginTop: "-5px",
              }}
            >
              Advisor
            </div>
          </div>
        </div>

        {/* 환영 메시지 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            marginTop: "50px",
          }}
        >
          <div
            style={{
              fontSize: "1.8rem",
              color: currentTextIndex === 0 ? "#333333" : "#666666",
              marginBottom: "8px",
              fontWeight: currentTextIndex === 0 ? "600" : "400",
              animation:
                "textFadeIn 0.4s ease-out, textFloat 2s ease-in-out infinite 0.4s",
              transition: "all 0.4s ease-in-out",
              opacity: 1,
            }}
            key={currentTextIndex}
          >
            {welcomeTexts[currentTextIndex]}
          </div>

          <div
            style={{
              width: "800px",
              height: "3px",
              background: "#00c73c",
              margin: "0 auto",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* 고객 로그인 버튼 제거 */}
      </div>

      {/* 하단 상태 표시 */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: isRecording ? "#fff5f5" : "#f0f9f8",
          padding: "12px 20px",
          borderRadius: "20px",
          border: isRecording ? "2px solid #ff6b6b" : "1px solid #e0f2f1",
          boxShadow: isRecording
            ? "0 4px 15px rgba(255, 107, 107, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
        }}
        onDoubleClick={() => {
          console.log("🔄 [태블릿] 녹음 상태 토글:", !isRecording);
          setIsRecording(!isRecording);
        }}
        title="더블클릭으로 녹음 상태 토글 (테스트용)"
      >
        {isRecording ? (
          <>
            {/* 녹음 중 애니메이션 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite 0.2s",
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#ff6b6b",
                  animation: "pulse 1.5s ease-in-out infinite 0.4s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "1rem",
                color: "#ff6b6b",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🎤 실시간 녹음중입니다
            </span>
          </>
        ) : (
          <>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00c73c",
              }}
            />
            <span
              style={{
                fontSize: "0.8rem",
                color: "#666666",
                fontWeight: "500",
              }}
            >
              행원이 태블릿을 조작중입니다
            </span>
          </>
        )}
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        @keyframes textFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes textFadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );

  const renderCustomerInfoPage = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "white",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>👤 고객 정보</h1>
      {currentCustomer && (
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "2rem",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.3)",
            minWidth: "400px",
          }}
        >
          <h2 style={{ marginBottom: "1.5rem" }}>
            {currentCustomer.name} 고객님
          </h2>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
            생년월일: {currentCustomer.dateOfBirth}
          </p>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
            연락처: {currentCustomer.contactNumber}
          </p>
          <p style={{ fontSize: "1.2rem", margin: "0.5rem 0" }}>
            주소: {currentCustomer.address}
          </p>
        </div>
      )}
    </div>
  );

  // 수익 계산 함수
  const calculateProfit = () => {
    if (!currentProduct) return 0;

    const monthlyRate = (currentProduct.baseRate || 2.0) / 100 / 12; // 월 이자율
    const totalMonths = simulationPeriod;
    const monthlyPayment = simulationAmount;

    // 복리 계산 (월복리)
    let totalAmount = 0;
    for (let month = 1; month <= totalMonths; month++) {
      const monthsRemaining = totalMonths - month + 1;
      const compoundInterest =
        monthlyPayment * Math.pow(1 + monthlyRate, monthsRemaining);
      totalAmount += compoundInterest;
    }

    return Math.round(totalAmount);
  };

  // 차트 데이터 생성 함수
  const generateProfitData = () => {
    if (!currentProduct) return [];

    const monthlyRate = (currentProduct.baseRate || 2.0) / 100 / 12;
    const monthlyPayment = simulationAmount;
    const data = [];

    let cumulativeAmount = 0;
    for (let month = 1; month <= simulationPeriod; month++) {
      const monthsRemaining = simulationPeriod - month + 1;
      const compoundInterest =
        monthlyPayment * Math.pow(1 + monthlyRate, monthsRemaining);
      cumulativeAmount += compoundInterest;

      data.push({
        month: month,
        profit: Math.round(cumulativeAmount),
        principal: monthlyPayment * month,
        interest: Math.round(cumulativeAmount - monthlyPayment * month),
      });
    }

    return data;
  };

  const renderCustomerHistoryPage = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8f9fa",
        padding: "2rem",
        overflow: "auto",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid #e9ecef",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#2c3e50",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          📋 고객 이력
        </h2>
        <button
          onClick={() => setCurrentPage("welcome")}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#5a6268";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#6c757d";
          }}
        >
          ← 돌아가기
        </button>
      </div>

      {/* 고객 정보 섹션 */}
      {customerProfile && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#2c3e50",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            👤 고객 정보
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <strong>이름:</strong> {customerProfile.name}
            </div>
            <div>
              <strong>생년월일:</strong>{" "}
              {customerProfile.birthDate || "정보 없음"}
            </div>
            <div>
              <strong>연락처:</strong> {customerProfile.phone || "정보 없음"}
            </div>
            <div>
              <strong>가입일:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* 상품 가입 이력 섹션 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#2c3e50",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          💰 상품 가입 이력
        </h3>

        {currentProduct ? (
          <div
            style={{
              backgroundColor: "#e8f5e8",
              border: "1px solid #28a745",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                color: "#155724",
                marginBottom: "0.5rem",
              }}
            >
              현재 상품
            </div>
            <div style={{ color: "#155724" }}>
              {currentProduct.productName || "상품명 정보 없음"}
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6c757d",
                marginTop: "0.5rem",
              }}
            >
              가입일: {new Date().toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#6c757d",
              fontSize: "1.1rem",
            }}
          >
            📝 아직 가입한 상품이 없습니다.
            <br />
            상품 탐색 탭에서 관심 있는 상품을 찾아보세요!
          </div>
        )}
      </div>

      {/* 상담 이력 섹션 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#2c3e50",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          💬 상담 이력
        </h3>

        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#6c757d",
            fontSize: "1.1rem",
          }}
        >
          📞 오늘의 상담이 여기에 기록됩니다.
          <br />
          행원과의 상담 내용이 실시간으로 업데이트됩니다.
        </div>
      </div>
    </div>
  );

  const renderProductDetailPage = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          backgroundColor: "white",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            background: "#f8fafc",
            color: "white",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "0 0 0.5rem 0",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              fontWeight: "bold",
            }}
          >
            {productFeatures?.productName || currentProduct?.name || "상품명"}
          </h1>
          {/* 자격 조건 및 적용 금리 표시 */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginTop: "1rem",
              alignItems: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>✅</span>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                상품 가입 가능
              </span>
            </div>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>💰</span>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                최종 적용 금리:{" "}
                {currentProduct?.basicRate
                  ? (currentProduct.basicRate + 1.3).toFixed(2)
                  : "2.00"}
                %
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: "1.2rem",
              opacity: 0.9,
              marginBottom: "0.5rem",
            }}
          >
            📊 상품 상세 정보
          </div>
          {/* 고객이 조작할 수 있는 버튼 제거 - 행원 PC에서만 제어 */}
        </div>

        {/* 모달 내용 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            background: "#ffffff",
          }}
        >
          {/* 1. 상품 상세정보 */}
          {currentProduct && (
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "1.5rem",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.2)",
                marginBottom: "1.5rem",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  marginBottom: "1rem",
                  fontSize: "1.8rem",
                  textAlign: "center",
                  color: "#1f2937",
                  fontWeight: "bold",
                }}
              >
                📋 상품 상세정보
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    🏦
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    상품 타입
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {currentProduct.productType || "적금"}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    💰
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    기본 금리
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {currentProduct.baseRate || "2.00"}%
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    📊
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    최소 금액
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {currentProduct.minAmount?.toLocaleString() || "100,000"}원
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    🎯
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    최대 금액
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {currentProduct.maxAmount?.toLocaleString() || "5,000,000"}
                    원
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: "1rem",
                  margin: "1.5rem 0 0 0",
                  opacity: 0.9,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                {currentProduct.description ||
                  "급여 하나로 OK! 월복리로 이자에 이자가 OK!"}
              </p>
            </div>
          )}

          {/* 2. 우대금리 정보 */}
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "1.5rem",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: "1.5rem",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.8rem",
                textAlign: "center",
                color: "#1f2937",
                fontWeight: "600",
              }}
            >
              💰 우대금리 정보
            </h3>

            {/* 금리 요약 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.2)",
                  padding: "1.5rem",
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  {preferentialRates?.breakdown?.basic?.label || "기본금리"}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {preferentialRates?.breakdown?.basic?.value ||
                    preferentialRates?.basicRate ||
                    currentProduct?.baseRate ||
                    "2.50%"}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.2)",
                  padding: "1.5rem",
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  {preferentialRates?.breakdown?.preferential?.label ||
                    "우대금리"}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {preferentialRates?.breakdown?.preferential?.value ||
                    preferentialRates?.preferentialRate ||
                    (() => {
                      // 우대조건들에서 실제 적용된 우대금리 계산
                      const conditions = preferentialRates?.conditions || [];
                      if (Array.isArray(conditions) && conditions.length > 0) {
                        const totalPreferentialRate = conditions
                          .filter((condition) => condition.checked === true)
                          .reduce((sum, condition) => {
                            const rate = parseFloat(condition.rate) || 0;
                            return sum + rate;
                          }, 0);
                        return totalPreferentialRate > 0
                          ? `${totalPreferentialRate.toFixed(2)}%`
                          : "0.00%";
                      }
                      return "0.00%";
                    })()}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  background:
                    "linear-gradient(135deg, rgba(46, 204, 113, 0.4), rgba(39, 174, 96, 0.4))",
                  padding: "1.5rem",
                  borderRadius: "15px",
                  border: "1px solid rgba(46, 204, 113, 0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    opacity: 0.9,
                    marginBottom: "0.5rem",
                  }}
                >
                  {preferentialRates?.breakdown?.total?.label || "총 금리"}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {preferentialRates?.breakdown?.total?.value ||
                    preferentialRates?.totalRate ||
                    (() => {
                      const basic = parseFloat(
                        preferentialRates?.breakdown?.basic?.value ||
                          preferentialRates?.basicRate ||
                          currentProduct?.baseRate ||
                          2.5
                      );
                      // 우대조건들에서 실제 적용된 우대금리 계산
                      const conditions = preferentialRates?.conditions || [];
                      let preferential = 0;
                      if (Array.isArray(conditions) && conditions.length > 0) {
                        preferential = conditions
                          .filter((condition) => condition.checked === true)
                          .reduce((sum, condition) => {
                            const rate = parseFloat(condition.rate) || 0;
                            return sum + rate;
                          }, 0);
                      } else {
                        // 우대조건이 없으면 breakdown에서 가져오기
                        preferential = parseFloat(
                          preferentialRates?.breakdown?.preferential?.value ||
                            preferentialRates?.preferentialRate ||
                            0
                        );
                      }
                      return `${(basic + preferential).toFixed(2)}%`;
                    })()}
                </div>
              </div>
            </div>

            {/* 우대조건 목록 */}
            {(() => {
              const conditions =
                preferentialRates?.conditions || preferentialRates || [];
              return Array.isArray(conditions) && conditions.length > 0;
            })() ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {(preferentialRates?.conditions || []).map(
                  (condition, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        background: "rgba(255,255,255,0.1)",
                        padding: "1.5rem",
                        borderRadius: "15px",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          background: condition.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        }}
                      >
                        {condition.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                          }}
                        >
                          {condition.name}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.9rem",
                            opacity: 0.9,
                          }}
                        >
                          {condition.description}
                        </p>
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: "bold",
                            color: condition.checked ? "#27ae60" : "#e74c3c",
                            background: condition.checked
                              ? "rgba(39, 174, 96, 0.2)"
                              : "rgba(231, 76, 60, 0.2)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "10px",
                          }}
                        >
                          {condition.checked ? "✅" : ""} +{condition.rate}%p
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                }}
              >
                우대조건 정보가 없습니다.
              </div>
            )}
          </div>

          {/* 3. 수익 시뮬레이션 */}
          {simulationData && (
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "1.5rem",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.2)",
                marginBottom: "1.5rem",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  marginBottom: "1.5rem",
                  fontSize: "1.8rem",
                  textAlign: "center",
                  color: "#1f2937",
                  fontWeight: "bold",
                }}
              >
                💰 수익 시뮬레이션
              </h3>

              {/* 상품 정보 표시 */}
              {productFeatures && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "1rem",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {productFeatures?.productName || "상품명"}
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    기본금리: {productFeatures?.basicRate || 2.0}% | 최고금리:{" "}
                    {productFeatures?.maxRate || 4.5}%
                  </div>
                  {productFeatures?.description && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.8,
                        marginTop: "0.5rem",
                      }}
                    >
                      {productFeatures?.description}
                    </div>
                  )}
                </div>
              )}

              {/* 현재 적용 금리 표시 */}
              {simulationData?.calculatedRate && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "1rem",
                    borderRadius: "12px",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    현재 적용 금리
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#27ae60",
                    }}
                  >
                    {simulationData.calculatedRate.toFixed(2)}%
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.8,
                      marginTop: "0.5rem",
                    }}
                  >
                    기본금리 {productFeatures?.basicRate || 2.0}% + 우대금리{" "}
                    {simulationData.calculatedRate -
                      (productFeatures?.basicRate || 2.0)}
                    %
                  </div>
                </div>
              )}

              {/* 시뮬레이션 결과 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    background: "rgba(255,255,255,0.2)",
                    padding: "1.5rem",
                    borderRadius: "15px",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    💵
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.8,
                      marginBottom: "0.5rem",
                    }}
                  >
                    총 납입금액
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                    {(() => {
                      const monthlyAmount =
                        simulationData?.simulationAmount || 3500000;
                      const period = simulationData?.simulationPeriod || 12;
                      return (monthlyAmount * period).toLocaleString();
                    })()}
                    원
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    background: "rgba(255,255,255,0.2)",
                    padding: "1.5rem",
                    borderRadius: "15px",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    📈
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.8,
                      marginBottom: "0.5rem",
                    }}
                  >
                    예상 이자
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                    {(() => {
                      // 적금 이자 올바른 계산
                      const monthlyAmount =
                        simulationData?.simulationAmount || 3500000;
                      const period = simulationData?.simulationPeriod || 12;
                      const rate = simulationData?.calculatedRate || 4.0;

                      // 적금 이자 계산: 평균 기간 사용
                      const totalDeposit = monthlyAmount * period;
                      const averagePeriod = (period + 1) / 2;
                      const expectedInterest =
                        totalDeposit * (rate / 100) * (averagePeriod / 12);

                      return expectedInterest.toLocaleString();
                    })()}
                    원
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    background:
                      "linear-gradient(135deg, rgba(46, 204, 113, 0.4), rgba(39, 174, 96, 0.4))",
                    padding: "1.5rem",
                    borderRadius: "15px",
                    border: "1px solid rgba(46, 204, 113, 0.5)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    🎯
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      marginBottom: "0.5rem",
                    }}
                  >
                    만기 수령액
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                    {(() => {
                      const monthlyAmount =
                        simulationData?.simulationAmount || 3500000;
                      const period = simulationData?.simulationPeriod || 12;
                      const rate = simulationData?.calculatedRate || 4.0;

                      const totalDeposit = monthlyAmount * period;
                      const averagePeriod = (period + 1) / 2;
                      const expectedInterest =
                        totalDeposit * (rate / 100) * (averagePeriod / 12);

                      return (totalDeposit + expectedInterest).toLocaleString();
                    })()}
                    원
                  </div>
                </div>
              </div>

              {/* 실시간 차트 표시 */}
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "1.5rem",
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <h4
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.2rem",
                    textAlign: "center",
                  }}
                >
                  📊 적금 vs 예금 비교 (월{" "}
                  {(
                    simulationData?.simulationAmount || 20000000
                  ).toLocaleString()}
                  원 × {simulationData?.simulationPeriod || 24}개월 = 총{" "}
                  {(
                    (simulationData?.simulationAmount || 20000000) *
                    (simulationData?.simulationPeriod || 24)
                  ).toLocaleString()}
                  원)
                </h4>

                {/* 수익 비교 차트 */}
                <div
                  style={{
                    height: "300px",
                    background:
                      "linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(155, 89, 182, 0.1))",
                    borderRadius: "15px",
                    padding: "15px",
                    animation: "chartFadeIn 1.5s ease-in-out",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateChartData(simulationData)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(44, 62, 80, 0.3)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#2c3e50"
                        fontSize={12}
                        tick={{ fill: "#2c3e50" }}
                      />
                      <YAxis
                        stroke="#2c3e50"
                        fontSize={12}
                        tick={{ fill: "#2c3e50" }}
                        tickFormatter={(value) =>
                          `${(value / 10000).toFixed(0)}만원`
                        }
                        domain={(() => {
                          // 차트 데이터에서 최소/최대값 계산
                          const chartData = generateChartData(simulationData);
                          const amounts = chartData.map((item) => item.amount);
                          const minAmount = Math.min(...amounts);
                          const maxAmount = Math.max(...amounts);

                          // 최소값에서 5% 빼고, 최대값에서 5% 더해서 여유 공간 확보
                          const padding = (maxAmount - minAmount) * 0.1;
                          const domainMin = Math.max(0, minAmount - padding);
                          const domainMax = maxAmount + padding;

                          return [domainMin, domainMax];
                        })()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "10px",
                          color: "white",
                        }}
                        formatter={(value, name, props) => [
                          `${value.toLocaleString()}원`,
                          "만기 수령액",
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            const monthlyAmount =
                              simulationData?.simulationAmount || 20000000;
                            const currentPeriod =
                              simulationData?.simulationPeriod || 24;
                            const totalDepositAmount =
                              monthlyAmount * currentPeriod;

                            return (
                              <div>
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {data.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#ccc",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {data.category === "현재상품"
                                    ? `월 납입: ${monthlyAmount.toLocaleString()}원`
                                    : `예치금액: ${totalDepositAmount.toLocaleString()}원`}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#ccc",
                                    marginBottom: "2px",
                                  }}
                                >
                                  기간: {currentPeriod}개월
                                </div>
                                {data.rate && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#ccc",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    금리: {data.rate}%
                                  </div>
                                )}
                                {data.category && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#ccc",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    유형: {data.category}
                                  </div>
                                )}
                                {data.rateType && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#ccc",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    금리유형: {data.rateType}
                                  </div>
                                )}
                                {data.minAmount &&
                                  data.minAmount > totalDepositAmount && (
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#ff6b6b",
                                        marginBottom: "2px",
                                      }}
                                    >
                                      ⚠️ 최소금액:{" "}
                                      {data.minAmount.toLocaleString()}원
                                    </div>
                                  )}
                                {data.riskLevel && (
                                  <div
                                    style={{ fontSize: "12px", color: "#ccc" }}
                                  >
                                    위험도: {data.riskLevel}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return label;
                        }}
                      />
                      {/* 메인 라인 */}
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3498db"
                        strokeWidth={4}
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                        dot={{
                          fill: "#3498db",
                          strokeWidth: 2,
                          r: 6,
                          style: { animation: "dotPulse 2s infinite" },
                        }}
                        activeDot={{
                          r: 10,
                          stroke: "#3498db",
                          strokeWidth: 3,
                          fill: "#fff",
                          style: { animation: "dotPulse 1s infinite" },
                        }}
                        animationDuration={3000}
                        animationEasing="ease-in-out"
                        style={{
                          animation: "lineDraw 3s ease-in-out forwards",
                        }}
                      />

                      {/* 보조 라인 (더 얇고 투명) */}
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3498db"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                        dot={false}
                        activeDot={false}
                        animationDuration={4000}
                        animationEasing="ease-in-out"
                        style={{
                          animation: "lineDraw 4s ease-in-out forwards 0.5s",
                        }}
                      />

                      {/* 하이라이트 라인 */}
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#e74c3c"
                        strokeWidth={1}
                        strokeOpacity={0.6}
                        dot={false}
                        activeDot={false}
                        animationDuration={5000}
                        animationEasing="ease-in-out"
                        style={{
                          animation: "lineDraw 5s ease-in-out forwards 1s",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 실시간 동기화 표시 */}
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(135deg, rgba(46, 204, 113, 0.9), rgba(39, 174, 96, 0.9))",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "25px",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              zIndex: 1000,
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🖥️</span>
            <span>PC와 실시간 동기화 중...</span>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#2ecc71",
                animation: "pulse 2s infinite",
              }}
            />
          </div>

          <style>{`
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

            @keyframes chartFadeIn {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes lineDraw {
              0% {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
              }
              100% {
                stroke-dasharray: 1000;
                stroke-dashoffset: 0;
              }
            }

            @keyframes dotPulse {
              0%,
              100% {
                r: 6;
                opacity: 1;
              }
              50% {
                r: 8;
                opacity: 0.8;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );

  const renderProductDescriptionViewer = () => {
    if (!showProductDescription || !currentProduct) {
      return null;
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#333" }}>
            상품설명서 - {currentProduct.product_name}
          </h2>
          <button
            onClick={() => setCurrentPage("welcome")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
        </div>

        {/* PDF 뷰어 */}
        <div style={{ flex: 1, padding: "20px", position: "relative" }}>
          <iframe
            src={`${getApiUrl(
              `/api/documents/product-pdf/${currentPage}`
            )}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&scrollbar=1&view=FitH&pagemode=none&disableworker=true`}
            width="100%"
            height="100%"
            style={{ border: "none", borderRadius: "8px" }}
            title="상품설명서"
          />

          {/* 하이라이트 렌더링 */}
          {(() => {
            const currentPageHighlights = highlights.filter(
              (highlight) => highlight.page === currentPage
            );
            console.log("🎨 태블릿 하이라이트 렌더링:", {
              totalHighlights: highlights.length,
              currentPageHighlights: currentPageHighlights.length,
              currentPage,
              highlights: currentPageHighlights,
            });
            return (currentPageHighlights || []).map((highlight) => {
              console.log("🎨 태블릿 개별 하이라이트 렌더링:", highlight);
              return (
                <div
                  key={highlight.id}
                  style={{
                    position: "absolute",
                    left: Math.min(highlight.startX, highlight.endX),
                    top: Math.min(highlight.startY, highlight.endY),
                    width: Math.abs(highlight.endX - highlight.startX),
                    height: Math.abs(highlight.endY - highlight.startY),
                    backgroundColor: highlight.color,
                    opacity: 0.3,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              );
            });
          })()}
        </div>

        {/* 페이지 정보 표시 (읽기 전용) */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#666" }}>
            {currentPage} / 80 페이지
          </span>
        </div>
      </div>
    );
  };

  const renderProductVisualizationPage = () => {
    if (!currentProduct) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            fontSize: "18px",
            color: "#666",
          }}
        >
          상품 정보를 불러오는 중...
        </div>
      );
    }

    return (
      <div
        style={{
          padding: "20px",
          height: "100%",
          overflow: "auto",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        {/* 상품 헤더 */}
        <div
          style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            marginBottom: "15px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.8rem",
              color: "#2c3e50",
              margin: "0 0 8px 0",
              fontWeight: "700",
            }}
          >
            {currentProduct.name || "상품명"}
          </h1>
          <span
            style={{
              background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "8px 20px",
              borderRadius: "25px",
              fontSize: "1rem",
              fontWeight: "600",
              display: "inline-block",
            }}
          >
            {currentProduct.category || "상품유형"}
          </span>
        </div>

        {/* 금리 정보 */}
        <div
          style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            marginBottom: "15px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "#3b82f6",
                color: "white",
                padding: "15px",
                borderRadius: "15px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: "0.9",
                  marginBottom: "5px",
                }}
              >
                기본금리
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                {currentProduct.basicRate || 2.0}%
              </div>
            </div>
            <div style={{ fontSize: "1.5rem", color: "#636e72" }}>→</div>
            <div
              style={{
                background: "#10b981",
                color: "white",
                padding: "15px",
                borderRadius: "15px",
                textAlign: "center",
                minWidth: "120px",
                transform: "scale(1.1)",
                boxShadow: "0 15px 35px rgba(0, 184, 148, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: "0.9",
                  marginBottom: "5px",
                }}
              >
                적용금리
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "700" }}>
                {currentProduct.calculatedRate?.toFixed(2) || "2.00"}%
              </div>
            </div>
            <div style={{ fontSize: "1.5rem", color: "#636e72" }}>→</div>
            <div
              style={{
                background: "#ef4444",
                color: "white",
                padding: "15px",
                borderRadius: "15px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: "0.9",
                  marginBottom: "5px",
                }}
              >
                최고금리
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                {currentProduct.maxRate || 4.15}%
              </div>
            </div>
          </div>
        </div>

        {/* 시뮬레이션 결과 */}
        <div
          style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            marginBottom: "15px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              color: "#2c3e50",
              marginBottom: "20px",
              fontSize: "1.3rem",
              fontWeight: "600",
            }}
          >
            💰 수익 시뮬레이션
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                border: "2px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>💵</div>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  opacity: "0.8",
                }}
              >
                총 납입금액
              </h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "700", margin: "0" }}>
                {(
                  (currentProduct.simulationAmount || 1000000) *
                  (currentProduct.simulationPeriod || 12)
                ).toLocaleString()}
                원
              </p>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                border: "2px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📈</div>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  opacity: "0.8",
                }}
              >
                예상 이자
              </h4>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  margin: "0",
                  color: "#00b894",
                }}
              >
                {Math.round(
                  ((currentProduct.simulationAmount || 1000000) *
                    (currentProduct.simulationPeriod || 12) *
                    (currentProduct.calculatedRate || 2.0)) /
                    100 /
                    2
                ).toLocaleString()}
                원
              </p>
            </div>

            <div
              style={{
                background: "#f8fafc",
                color: "white",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                border: "2px solid #667eea",
                transform: "scale(1.05)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎯</div>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  opacity: "0.8",
                }}
              >
                만기 수령액
              </h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "700", margin: "0" }}>
                {Math.round(
                  (currentProduct.simulationAmount || 1000000) *
                    (currentProduct.simulationPeriod || 12) +
                    ((currentProduct.simulationAmount || 1000000) *
                      (currentProduct.simulationPeriod || 12) *
                      (currentProduct.calculatedRate || 2.0)) /
                      100 /
                      2
                ).toLocaleString()}
                원
              </p>
            </div>
          </div>
        </div>

        {/* 동기화 상태 표시 */}
        <div
          style={{
            background: "rgba(0, 184, 148, 0.1)",
            border: "2px solid #00b894",
            borderRadius: "10px",
            padding: "15px",
            textAlign: "center",
            color: "#00b894",
            fontWeight: "600",
          }}
        >
          🔄 PC와 실시간 동기화 중...
        </div>
      </div>
    );
  };

  const renderProductSimulationPage = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          overflow: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "2rem",
            textAlign: "center",
            maxWidth: "900px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h1
            style={{
              color: "#2d3748",
              marginBottom: "1rem",
              fontSize: "1.8rem",
            }}
          >
            상품 시뮬레이션
          </h1>
          <p
            style={{
              color: "#4a5568",
              marginBottom: "2rem",
              fontSize: "1rem",
            }}
          >
            {currentProduct?.product_name || "상품"}의 시뮬레이션을 확인하고
            있습니다.
          </p>

          {/* 시뮬레이션 시각화 카드들 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {/* 자격 조건 및 상품 가입 가능 여부 */}
            <div
              style={{
                background: qualificationStatus?.canEnroll
                  ? "linear-gradient(135deg, #4CAF50, #45a049)"
                  : "linear-gradient(135deg, #f44336, #d32f2f)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                {qualificationStatus?.canEnroll ? "✅" : "❌"}
              </div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                자격 조건
              </h3>
              <p style={{ margin: "0", fontSize: "0.9rem", opacity: 0.9 }}>
                {qualificationStatus?.canEnroll
                  ? "상품 가입 가능"
                  : "상품 가입 불가능"}
              </p>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                {qualificationStatus?.canEnroll
                  ? "✅ 조건 만족"
                  : "❌ 조건 불만족"}
              </div>
            </div>

            {/* 가입 기간 */}
            <div
              style={{
                background: "#3b82f6",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                가입 기간
              </h3>
              <p style={{ margin: "0", fontSize: "0.9rem", opacity: 0.9 }}>
                {currentProduct?.deposit_period || "상품별 상이"}
              </p>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                추천: 12개월
              </div>
            </div>

            {/* 가입 금액 */}
            <div
              style={{
                background: "#f59e0b",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                가입 금액
              </h3>
              <p style={{ margin: "0", fontSize: "0.9rem", opacity: 0.9 }}>
                {currentProduct?.deposit_amount || "상품별 상이"}
              </p>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                최소: 1천만원
              </div>
            </div>

            {/* 기준금리 */}
            <div
              style={{
                background: "#8b5cf6",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📈</div>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
                기준금리
              </h3>
              <p style={{ margin: "0", fontSize: "0.9rem", opacity: 0.9 }}>
                {currentProduct?.interest_rate || "시장금리 연동"}
              </p>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                우대: +0.5%
              </div>
            </div>
          </div>

          {/* 상품 정보 요약 */}
          <div
            style={{
              background: "#f7fafc",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                color: "#2d3748",
                marginBottom: "1rem",
                fontSize: "1.1rem",
              }}
            >
              상품 정보 요약
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <strong>상품명:</strong>
                <br />
                {currentProduct?.product_name || "정보 없음"}
              </div>
              <div>
                <strong>상품유형:</strong>
                <br />
                {currentProduct?.product_type || "정보 없음"}
              </div>
              <div>
                <strong>대상고객:</strong>
                <br />
                {currentProduct?.target_customers || "정보 없음"}
              </div>
              <div>
                <strong>특징:</strong>
                <br />
                {currentProduct?.product_features || "정보 없음"}
              </div>
            </div>
          </div>

          <p style={{ color: "#718096", fontSize: "0.9rem" }}>
            행원이 PC에서 시뮬레이션을 조작하면 여기에 실시간으로 반영됩니다.
          </p>
        </div>
      </div>
    );
  };

  const renderProductEnrollmentPage = () => {
    // currentFormIndex에 따라 다른 서식 표시
    console.log("📄 [태블릿] 서식 렌더링 시작");
    console.log("📄 [태블릿] currentFormIndex:", currentFormIndex);
    console.log("📄 [태블릿] currentForm:", currentForm);
    console.log("📄 [태블릿] currentProduct:", currentProduct);
    console.log("📄 [태블릿] currentPage:", currentPage);

    // 모달 오버레이 스타일
    const modalOverlayStyle = {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    };

    const modalContentStyle = {
      backgroundColor: "white",
      borderRadius: "12px",
      maxWidth: "90%",
      maxHeight: "90%",
      overflow: "auto",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    };

    // 서식이 없는 경우 처리
    if (!currentForm) {
      console.log("⚠️ [태블릿] currentForm이 없음 - 로딩 상태 표시");
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ padding: "40px", textAlign: "center" }}>
              <h3>서식을 불러오는 중...</h3>
              <p>잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentFormIndex === 0) {
      // 첫 번째 서식: 개인정보 수집·이용 동의서
      console.log("📄 [태블릿] 개인정보 수집·이용 동의서 렌더링");
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* 서식 네비게이션 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>
                서식 {currentFormIndex + 1}/4: 개인정보 수집·이용 동의서
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  행원 PC에서 서식을 변경해주세요
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                position: "relative",
                zIndex: 1000,
                backgroundColor: "#ffffff",
              }}
            >
              <ConsentForm
                fieldValues={fieldValues}
                onFieldClick={(fieldId, fieldLabel, fieldType) => {
                  console.log("🖱️ [태블릿] ConsentForm 필드 클릭:", {
                    fieldId,
                    fieldLabel,
                    fieldType,
                  });

                  // 자동 채우기인 경우 fieldValues에 직접 설정
                  if (fieldType === "auto-fill" && fieldLabel) {
                    console.log(
                      `✅ [태블릿] 자동 채우기 적용: ${fieldId} = ${fieldLabel}`
                    );
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldId]: fieldLabel,
                    }));
                    return; // 자동 채우기인 경우 입력 모드로 진입하지 않음
                  }

                  // 서명 필드인 경우 특별 처리
                  if (fieldType === "signature") {
                    console.log(
                      "✍️ [태블릿] 서명 필드 클릭 - 서명 모드 활성화"
                    );
                    openModal("signaturePad", { fieldId, fieldLabel: "서명" });
                    // 서명 필드 클릭 시에는 WebSocket 메시지 전송을 방지하기 위해
                    // 텍스트 입력 모드를 비활성화
                    setIsFieldInputMode(false);
                    setFocusedField(null);
                    return; // 서명 필드인 경우 텍스트 입력 모드로 진입하지 않음
                  }
                }}
              />
            </div>
          </div>
        </div>
      );
    } else if (currentFormIndex === 1) {
      // 두 번째 서식: 은행거래신청서
      console.log("📄 [태블릿] 은행거래신청서 렌더링");
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* 서식 네비게이션 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>
                서식 {currentFormIndex + 1}/4: 은행거래신청서
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  행원 PC에서 서식을 변경해주세요
                </div>
              </div>
            </div>
            <ApplicationForm
              fieldValues={fieldValues}
              onFieldClick={(fieldId, fieldLabel, fieldType) => {
                console.log("🖱️ [태블릿] ApplicationForm 필드 클릭:", {
                  fieldId,
                  fieldLabel,
                  fieldType,
                });
                // 서명 필드인 경우 특별 처리
                if (fieldType === "signature") {
                  console.log("✍️ [태블릿] 서명 필드 클릭 - 서명 모드 활성화");
                  openModal("signaturePad", { fieldId, fieldLabel: "서명" });
                  // 서명 필드 클릭 시에는 WebSocket 메시지 전송을 방지하기 위해
                  // 텍스트 입력 모드를 비활성화
                  setIsFieldInputMode(false);
                  setFocusedField(null);
                }
              }}
            />
          </div>
        </div>
      );
    } else if (currentFormIndex === 2) {
      // 세 번째 서식: 개인 전자금융서비스 신청서
      console.log("📄 [태블릿] 개인 전자금융서비스 신청서 렌더링");
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* 서식 네비게이션 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>
                서식 {currentFormIndex + 1}/4: 개인 전자금융서비스 신청서
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  행원 PC에서 서식을 변경해주세요
                </div>
              </div>
            </div>
            <ElectronicFinanceForm
              fieldValues={fieldValues}
              onFieldClick={(fieldId, fieldLabel, fieldType) => {
                console.log("🖱️ [태블릿] ElectronicFinanceForm 필드 클릭:", {
                  fieldId,
                  fieldLabel,
                  fieldType,
                });
                // 서명 필드인 경우 특별 처리
                if (fieldType === "signature") {
                  console.log("✍️ [태블릿] 서명 필드 클릭 - 서명 모드 활성화");
                  openModal("signaturePad", { fieldId, fieldLabel: "서명" });
                  // 서명 필드 클릭 시에는 WebSocket 메시지 전송을 방지하기 위해
                  // 텍스트 입력 모드를 비활성화
                  setIsFieldInputMode(false);
                  setFocusedField(null);
                }
              }}
            />
          </div>
        </div>
      );
    } else if (currentFormIndex === 3) {
      // 네 번째 서식: 금융거래목적확인서
      console.log("📄 [태블릿] 금융거래목적확인서 렌더링");
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* 서식 네비게이션 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>
                서식 {currentFormIndex + 1}/4: 금융거래목적확인서
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  행원 PC에서 서식을 변경해주세요
                </div>
              </div>
            </div>
            <FinancialPurposeForm
              fieldValues={fieldValues}
              onFieldClick={(fieldId, fieldLabel, fieldType) => {
                console.log("🖱️ [태블릿] FinancialPurposeForm 필드 클릭:", {
                  fieldId,
                  fieldLabel,
                  fieldType,
                });
                // 서명 필드인 경우 특별 처리
                if (fieldType === "signature") {
                  console.log("✍️ [태블릿] 서명 필드 클릭 - 서명 모드 활성화");
                  openModal("signaturePad", { fieldId, fieldLabel: "서명" });
                  // 서명 필드 클릭 시에는 WebSocket 메시지 전송을 방지하기 위해
                  // 텍스트 입력 모드를 비활성화
                  setIsFieldInputMode(false);
                  setFocusedField(null);
                }
              }}
            />
          </div>
        </div>
      );
    } else {
      // 기본값: 알 수 없는 서식 인덱스
      console.log("⚠️ [태블릿] 알 수 없는 서식 인덱스:", currentFormIndex);
      return (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h2>서식을 불러오는 중...</h2>
              <p>현재 서식 인덱스: {currentFormIndex}</p>
              <p>서식 데이터: {currentForm ? "있음" : "없음"}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderTabletSimulationPage = () => {
    return <TabletSimulationView simulationData={simulationData} />;
  };

  const renderEmployeeLoginPage = () => {
    const handleLogin = async () => {
      if (!loginData.employeeId || !loginData.password) {
        alert("직원 ID와 비밀번호를 입력해주세요.");
        return;
      }

      try {
        // Supabase 함수를 사용한 직원 로그인 API 호출
        const response = await fetch(
          "https://jhfjigeuxrxxbbsoflcd.supabase.co/functions/v1/login-api",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ",
            },
            body: JSON.stringify({
              employeeId: loginData.employeeId.trim(),
              password: loginData.password.trim(),
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          // 로그인 성공 시 직원 정보 처리
          const employeeData = result.employee;
          handleEmployeeLogin(employeeData);
          console.log("✅ [태블릿] 직원 로그인 성공:", employeeData);
        } else {
          alert("로그인에 실패했습니다. 직원 ID와 비밀번호를 확인해주세요.");
        }
      } catch (error) {
        console.error("❌ [태블릿] 로그인 오류:", error);
        alert("로그인 중 오류가 발생했습니다: " + error.message);
      }
    };

    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "3rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#008485",
                margin: "0 0 0.5rem 0",
              }}
            >
              태블릿 로그인
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "#666",
                margin: "0",
              }}
            >
              직원 계정으로 로그인해주세요
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#333",
                marginBottom: "0.5rem",
              }}
            >
              직원 ID
            </label>
            <input
              type="text"
              value={loginData.employeeId}
              onChange={(e) =>
                setLoginData({ ...loginData, employeeId: e.target.value })
              }
              placeholder="직원 ID를 입력하세요"
              style={{
                width: "100%",
                padding: "1rem",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#333",
                marginBottom: "0.5rem",
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              placeholder="비밀번호를 입력하세요"
              style={{
                width: "100%",
                padding: "1rem",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              backgroundColor: "#008485",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#006666")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#008485")}
          >
            로그인
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.9rem",
              color: "#666",
            }}
          >
            <p>로그인 후 직원과 일대일로 연결됩니다</p>
          </div>
        </div>
      </div>
    );
  };

  const renderProductRecommendationPage = () => {
    if (!currentProduct) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.5rem",
            color: "#666",
          }}
        >
          상품 정보를 불러오는 중...
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          overflow: "auto",
          backgroundColor: "#f8f9fa",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* 상품 헤더 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "2rem",
              paddingBottom: "1rem",
              borderBottom: "2px solid #008485",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#008485",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {currentProduct.title}
              </h1>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: currentProduct.badgeColor || "#008485",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                {currentProduct.badge}
              </div>
            </div>
          </div>

          {/* 상품 설명 */}
          <div style={{ marginBottom: "2rem" }}>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: "1.6",
                color: "#333",
                margin: "0 0 1rem 0",
              }}
            >
              {currentProduct.description}
            </p>
          </div>

          {/* 상품 정보 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: currentProduct.borderColor || "#008485",
                  marginBottom: "0.5rem",
                }}
              >
                {currentProduct.interestRate}%
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#666",
                }}
              >
                연이율
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "0.5rem",
                }}
              >
                {currentProduct.minAmount?.toLocaleString()}원
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#666",
                }}
              >
                최소금액
              </div>
            </div>
          </div>

          {/* 추천 이유 */}
          <div
            style={{
              backgroundColor: "#e8f5f5",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#008485",
                margin: "0 0 1rem 0",
              }}
            >
              💡 추천 이유
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: "1.5",
                color: "#333",
                margin: "0",
              }}
            >
              {currentProduct.reason}
            </p>
          </div>

          {/* 주요 특징 */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "2px solid #008485",
              padding: "1.5rem",
              borderRadius: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#008485",
                margin: "0 0 1rem 0",
              }}
            >
              ✨ 주요 특징
            </h3>
            <div
              style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#333",
              }}
            >
              {currentProduct.features?.join(" • ") ||
                "상세 정보는 담당자에게 문의하세요."}
            </div>
          </div>

          {/* 뒤로가기 버튼 */}
          <div
            style={{
              textAlign: "center",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={() => setCurrentPage("welcome")}
              style={{
                backgroundColor: "#008485",
                color: "white",
                border: "none",
                padding: "1rem 2rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#006666")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#008485")}
            >
              메인 화면으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSimulationResultPage = () => {
    const data = simulationData || {};
    const selectedProduct = data.selectedProduct || {};
    const simulationResult = data.simulationResult || {
      baseInterestRate: 0,
      totalInterestRate: 0,
      benefits: [],
    };
    const selectedConditions = data.selectedConditions || [];
    const customer = data.customer || {};

    return (
      <div
        style={{
          padding: "2rem",
          height: "100%",
          overflow: "auto",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              margin: "0 0 0.5rem 0",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            🎯 혜택 시뮬레이션 결과
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.9,
              margin: 0,
            }}
          >
            {customer?.Name || "고객"}님의 맞춤 상품 분석
          </p>
        </div>

        {/* 선택된 상품 정보 */}
        {selectedProduct && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: "1.5rem",
              borderRadius: "20px",
              marginBottom: "2rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                margin: "0 0 1rem 0",
                color: "#fff",
              }}
            >
              📋 선택된 상품
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                }}
              >
                {selectedProduct.productType === "적금" ? "💰" : "🏦"}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  {selectedProduct.productName}
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    opacity: 0.8,
                    margin: 0,
                  }}
                >
                  {selectedProduct.productType} • 기본금리{" "}
                  {selectedProduct.baseRate}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 시뮬레이션 결과 */}
        {simulationResult && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: "1.5rem",
              borderRadius: "20px",
              marginBottom: "2rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                margin: "0 0 1rem 0",
                color: "#fff",
              }}
            >
              📊 예상 수익 분석
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  총 납입금액
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#4CAF50",
                  }}
                >
                  {simulationResult.totalDeposit?.toLocaleString() || "계산 중"}
                  원
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  예상 이자
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#2196F3",
                  }}
                >
                  {simulationResult.expectedInterest?.toLocaleString() ||
                    "계산 중"}
                  원
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  만기 수령액
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#FF9800",
                  }}
                >
                  {simulationResult.totalAmount?.toLocaleString() || "계산 중"}
                  원
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    opacity: 0.8,
                    marginBottom: "0.5rem",
                  }}
                >
                  적용 금리
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#E91E63",
                  }}
                >
                  {simulationResult.finalRate?.toFixed(2) || "계산 중"}%
                </div>
              </div>
            </div>

            {/* 혜택 목록 */}
            {simulationResult.benefits &&
              simulationResult.benefits.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "600",
                      margin: "0 0 1rem 0",
                      color: "#fff",
                    }}
                  >
                    🎁 적용된 혜택
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "0.5rem",
                    }}
                  >
                    {simulationResult.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.8rem",
                          background: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "500",
                          }}
                        >
                          {benefit.BenefitName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: "700",
                            color: "#4CAF50",
                          }}
                        >
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

        {/* 선택된 우대조건 */}
        {selectedConditions && selectedConditions.length > 0 && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: "1.5rem",
              borderRadius: "20px",
              marginBottom: "2rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                margin: "0 0 1rem 0",
                color: "#fff",
              }}
            >
              ✅ 적용 가능한 우대조건
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {selectedConditions.map((condition, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "15px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      margin: "0 0 0.5rem 0",
                      color: "#fff",
                    }}
                  >
                    {condition.ConditionName}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.8,
                      margin: "0 0 0.5rem 0",
                      lineHeight: "1.4",
                    }}
                  >
                    {condition.Description}
                  </p>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#4CAF50",
                    }}
                  >
                    우대금리: +{condition.BenefitValue}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 안내 메시지 */}
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "15px",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            style={{
              fontSize: "1rem",
              margin: 0,
              opacity: 0.9,
            }}
          >
            💡 위 시뮬레이션 결과는 예상 수치이며, 실제 결과와 다를 수 있습니다.
          </p>
        </div>
      </div>
    );
  };

  const renderCurrentPage = () => {
    // 초기화가 완료되지 않은 경우 로딩 화면 표시
    if (!isInitialized) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              animation: "spin 2s linear infinite",
            }}
          >
            🔄
          </div>
          <h2 style={{ color: "#00c73c", marginBottom: "0.5rem" }}>
            태블릿 초기화 중...
          </h2>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>
            잠시만 기다려주세요
          </p>
          <style>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      );
    }

    // 인트로 슬라이드가 표시되어야 하는 경우 (최우선)
    console.log("🔍 [태블릿] renderCurrentPage - showIntro:", showIntro);
    if (showIntro) {
      console.log("🎬 [태블릿] 인트로 슬라이드 표시 - IntroSlider 렌더링");
      return <IntroSlider onComplete={handleIntroComplete} />;
    }

    // 기존 모달들은 새로운 모달 시스템으로 대체 예정

    // 초기화가 완료되지 않은 경우 로딩 표시
    if (!isInitialized) {
      console.log("⏳ [태블릿] 초기화 중...");
      return (
        <div
          style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 30%, #86efac 50%, #bbf7d0 70%, #dcfce7 85%, #f0fdf4 100%)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏦</div>
          <h2 style={{ color: "#333", fontSize: "24px", marginBottom: "10px" }}>
            하나은행 태블릿
          </h2>
          <p style={{ color: "#666", fontSize: "16px" }}>초기화 중입니다...</p>
        </div>
      );
    }

    console.log("🔍 [태블릿] 렌더링 상태:", {
      currentPage,
      showIntro,
      isInitialized,
      // forceReset, (제거됨)
    });

    // 직원 로그인이 필요한 경우
    if (!isEmployeeLoggedIn) {
      return renderEmployeeLoginPage();
    }

    switch (currentPage) {
      case "welcome":
        return renderWelcomePage();
      case "recommendations":
        return renderRecommendationsPage();
      case "product-recommendation":
        return renderProductRecommendationPage();
      case "customer-info":
        return renderCustomerInfoPage();
      case "customer-history":
        return renderCustomerHistoryPage();
      case "product-detail":
        return renderWelcomePage();
      case "product-enrollment":
        return renderProductEnrollmentPage();
      case "product-visualization":
        return renderProductVisualizationPage();
      case "consent-form":
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              position: "relative",
              zIndex: 1000,
              backgroundColor: "#ffffff",
            }}
          >
            <ConsentForm />
          </div>
        );
      case "application-form":
        return <ApplicationForm />;
      default:
        return renderWelcomePage();
    }
  };

  return (
    <TabletContainer isFullscreen={isFullscreen}>
      {/* 전체화면 토글 버튼 */}
      <FullscreenToggle
        onClick={toggleFullscreen}
        title={isFullscreen ? "전체화면 해제" : "전체화면"}
      >
        {isFullscreen ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </FullscreenToggle>

      {/* 새로고침 버튼 (전체화면일 때만 표시) */}
      {isFullscreen && (
        <FullscreenToggle
          onClick={openRefreshModal}
          title="새로고침"
          style={{ top: "80px", right: "20px" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </FullscreenToggle>
      )}

      {/* 메인 콘텐츠 */}
      {renderCurrentPage()}

      {/* 새로운 모달 시스템 - 인트로가 완료된 후에만 표시 */}
      {!showIntro && (
        <ModalManager
          modals={modals}
          onCloseModal={closeModal}
          onModalAction={handleModalAction}
          isTablet={true}
          stompClient={stompClient}
          sessionId={sessionId}
        />
      )}
      {/* CSS 애니메이션 */}
      <style>
        {`
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
          
          @keyframes rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
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
          
          @keyframes glow {
            0% {
              box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
            }
            50% {
              box-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
            }
          }
        `}
      </style>

      {/* 개선된 필드 입력 모달 */}
      <FieldInputModal
        isOpen={isFieldInputMode && !!focusedField}
        fieldData={focusedField}
        currentValue={
          focusedField ? fieldValues[focusedField.fieldId] || "" : ""
        }
        onComplete={(value) => {
          // 필드 값 업데이트
          if (focusedField) {
            setFieldValues((prev) => ({
              ...prev,
              [focusedField.fieldId]: value,
            }));

            // PC에 필드 입력 완료 메시지 전송
            if (stompClient && stompClient.active) {
              stompClient.publish({
                destination: `/topic/session/${sessionId}`,
                body: JSON.stringify({
                  type: "field-input-complete",
                  data: {
                    fieldId: focusedField.fieldId,
                    fieldValue: value,
                    fieldName: focusedField.fieldLabel,
                    formId: focusedField.formId,
                    timestamp: new Date().toISOString(),
                  },
                }),
              });
              console.log("📤 필드 입력 완료 메시지 전송:", {
                fieldId: focusedField.fieldId,
                fieldValue: value,
                sessionId: "tablet_main", // 하드코딩으로 일관성 확보
              });
            }
          }

          // 필드 입력 모드 종료
          setIsFieldInputMode(false);
          setFocusedField(null);
        }}
        onCancel={() => {
          setIsFieldInputMode(false);
          setFocusedField(null);
        }}
      />

      {/* 기존 인라인 필드 입력 모달 (교체 예정) */}
      {false && isFieldInputMode && focusedField && (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h2
              style={{
                color: "#2d3748",
                marginBottom: "1rem",
                textAlign: "center",
                fontSize: "1.5rem",
              }}
            >
              📝 {focusedField.fieldLabel} 입력
            </h2>

            <div
              style={{
                background: "#f7fafc",
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
                color: "#4a5568",
              }}
            >
              <div>
                <strong>서식:</strong> {focusedField.formName || "알 수 없음"}
              </div>
              <div>
                <strong>필드 ID:</strong> {focusedField.fieldId}
              </div>
              <div>
                <strong>타입:</strong> {focusedField.fieldType}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                  color: "#4a5568",
                }}
              >
                {focusedField.fieldLabel}
                {focusedField.required && (
                  <span style={{ color: "red", marginLeft: "0.25rem" }}>*</span>
                )}
              </label>

              <input
                type="text"
                placeholder={focusedField.fieldPlaceholder || "입력해주세요"}
                value={fieldValues[focusedField.fieldId] || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFieldValues((prev) => ({
                    ...prev,
                    [focusedField.fieldId]: value,
                  }));

                  // 실시간으로 행원 화면에 필드 값 동기화 (입력 완료가 아닌 실시간 동기화)
                  if (stompClient && sessionId && stompClient.active) {
                    stompClient.publish({
                      destination: "/topic/session/" + sessionId,
                      body: JSON.stringify({
                        type: "field-input-sync", // field-input-complete가 아닌 field-input-sync 사용
                        data: {
                          fieldId: focusedField.fieldId,
                          value: value,
                          fieldName: focusedField.fieldLabel,
                          formId: focusedField.formId,
                          timestamp: new Date().toISOString(),
                        },
                      }),
                    });
                    console.log("📤 실시간 필드 값 동기화:", {
                      fieldId: focusedField.fieldId,
                      value: value,
                      sessionId: sessionId,
                      stompClientActive: stompClient.active,
                    });
                  }
                }}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4CAF50";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                }}
                autoFocus
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setIsFieldInputMode(false);
                  setFocusedField(null);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#e2e8f0",
                  color: "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                취소
              </button>

              <button
                onClick={() => {
                  const value = fieldValues[focusedField.fieldId] || "";

                  // PC에 필드 입력 완료 메시지 전송 (직접 토픽으로 전송)
                  if (stompClient && sessionId && stompClient.connected) {
                    const message = {
                      type: "field-input-complete",
                      data: {
                        fieldId: focusedField.fieldId,
                        value: value,
                        fieldName: focusedField.fieldLabel,
                        formId: focusedField.formId,
                        timestamp: new Date().toISOString(),
                      },
                    };

                    stompClient.publish({
                      destination: `/topic/session/${sessionId}`,
                      body: JSON.stringify(message),
                    });

                    console.log("📤 [태블릿] 필드 입력 완료 메시지 전송:", {
                      destination: `/topic/session/${sessionId}`,
                      message: message,
                      stompClientConnected: stompClient.connected,
                      sessionId: "tablet_main",
                    });
                  } else {
                    console.error("❌ [태블릿] WebSocket 연결 상태 오류:", {
                      stompClient: !!stompClient,
                      connected: stompClient?.connected,
                      sessionId: sessionId,
                    });
                  }

                  // 필드 입력 모드만 종료하고 서식은 유지
                  setIsFieldInputMode(false);
                  setFocusedField(null);

                  // 서식 상태가 유지되도록 강제로 설정 (더 강력하게)
                  setTimeout(() => {
                    if (currentPage !== "product-enrollment") {
                      console.log(
                        "⚠️ [태블릿] 서식 상태 복원 - product-enrollment로 강제 전환"
                      );
                      setCurrentPage("product-enrollment");
                      // 전역 변수도 강제로 설정
                      window.currentTabletPage = "product-enrollment";
                    }
                  }, 100);

                  // 서식 상태가 유지되도록 로그 출력
                  console.log("📄 [태블릿] 필드 입력 완료 후 서식 상태 유지:");
                  console.log("- currentPage:", currentPage);
                  console.log("- currentFormIndex:", currentFormIndex);
                  console.log("- currentForm:", currentForm);
                  console.log("- currentProduct:", currentProduct);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                입력 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새로고침 모달 */}
      <RefreshModal isOpen={showRefreshModal}>
        <RefreshModalContent>
          <RefreshModalTitle>새로고침</RefreshModalTitle>
          <RefreshModalMessage>
            태블릿을 새로고침하시겠습니까?
            <br />
            현재 진행 중인 작업이 초기화될 수 있습니다.
          </RefreshModalMessage>
          <RefreshModalButtons>
            <RefreshModalButton
              className="secondary"
              onClick={closeRefreshModal}
            >
              취소
            </RefreshModalButton>
            <RefreshModalButton className="primary" onClick={handleRefresh}>
              새로고침
            </RefreshModalButton>
          </RefreshModalButtons>
        </RefreshModalContent>
      </RefreshModal>

      {/* AI 추천 결과 표시 */}
      {showAiRecommendations && (
        <AIRecommendationDisplay
          recommendations={aiRecommendations}
          confidence={recommendationConfidence}
          customerName={customerName}
        />
      )}
    </TabletContainer>
  );
};

export default CustomerTablet;
