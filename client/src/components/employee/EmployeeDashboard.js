import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getWebSocketUrl } from "../../config/api";
import Webcam from "react-webcam";
import CustomerLoginModal from "../common/CustomerLoginModal";

import ProductExplorer from "./ProductExplorer";
import SimulationPanel from "./SimulationPanel";
import CustomerInfo from "./CustomerInfo";
import FormManager from "./FormManager";
import ConsentForm from "../customer/ConsentForm";
import ApplicationForm from "../customer/ApplicationForm";
import ElectronicFinanceForm from "./ElectronicFinanceForm";
import FinancialPurposeForm from "./FinancialPurposeForm";
import {
  checkFormCompletion,
  saveFormWithScreenshot,
} from "../../utils/screenshotUtils";
import {
  supabase,
  uploadToStorage,
  uploadJsonToStorage,
} from "../../config/supabase";
import html2canvas from "html2canvas";
import { showToast, muteToasts } from "../common/Toast";
import SpeakerClassificationDemo from "../common/SpeakerClassificationDemo";
import VoiceProfileManager from "./VoiceProfileManager";
import RealtimeChat from "./RealtimeChat";
import CustomerInfoDisplay from "./CustomerInfoDisplay";
import ConsultationSessions from "./ConsultationSessions";
import InterestCalculator from "./InterestCalculator";

// Styled Components
import {
  DashboardContainer,
  SidebarToggle,
  SidebarOverlay,
  Sidebar,
  MainContent,
  SessionStatus,
  ContentArea,
  Section,
  SectionTitle,
  Button,
  NavigationTabs,
  NavTab,
  TabContainer,
  Tab,
  CustomerCard,
  CustomerName,
  CustomerDetails,
  StatusBadge,
  CameraContainer,
  CameraOverlay,
  FileInput,
  FileInputLabel,
  TabContent,
  DashboardGrid,
  GridSection,
  RecordingStatus,
  RecordingIndicator,
  RecordingDot,
  RecordingText,
  RecordingTimer,
  RecordingDescription,
} from "./EmployeeDashboard.styles";

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [showCustomerLoginModal, setShowCustomerLoginModal] = useState(false);
  const [customerProducts, setCustomerProducts] = useState([]);
  const [loadingCustomerProducts, setLoadingCustomerProducts] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [activeTab, setActiveTab] = useState("customer");
  const [apiForms, setApiForms] = useState(null); // API에서 받은 서식 데이터
  const pyannoteSTTRef = useRef(null);

  // 실시간 채팅 메시지 상태
  const [chatMessages, setChatMessages] = useState([]);
  const [currentInterimText, setCurrentInterimText] = useState("");
  const [currentSpeaker, setCurrentSpeaker] = useState("speaker_employee");

  // AI 추천 결과 상태
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [recommendationIntent, setRecommendationIntent] = useState("");

  // 탭 변경 시 태블릿으로 동기화하는 함수
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);

    // products 탭으로 변경할 때는 apiForms를 리셋하지 않음 (기존 폼 데이터 유지)
    if (newTab === "products") {
      setSelectedProduct(null);
      // setApiForms(null); // apiForms는 유지하여 시뮬데이터 방지
    }

    // 태블릿으로 탭 변경 메시지 전송
    if (stompClient && sessionId) {
      try {
        // WebSocket 연결 상태 확인
        if (stompClient.connected) {
          const tabChangeMessage = {
            type: "tab-change",
            data: {
              activeTab: newTab,
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          };

          stompClient.publish({
            destination: "/topic/session/" + sessionId,
            body: JSON.stringify(tabChangeMessage),
          });

          console.log("📤 태블릿에 탭 변경 메시지 전송:", tabChangeMessage);

          // 시뮬레이션 탭으로 전환 시 태블릿에 시뮬레이션 열기 신호 전송
          if (newTab === "simulation") {
            stompClient.publish({
              destination: "/app/send-message",
              body: JSON.stringify({
                sessionId: sessionId,
                type: "simulation-open",
                data: { openedAt: new Date().toISOString() },
              }),
            });
            console.log("📱 태블릿에 시뮬레이션 열기 전송");
          }

          // 메인 대시보드로 전환 시 태블릿을 기본 화면으로 리셋
          if (newTab === "dashboard") {
            stompClient.publish({
              destination: "/app/send-to-session",
              body: JSON.stringify({
                sessionId: sessionId,
                type: "reset-to-main",
                data: {
                  timestamp: new Date().toISOString(),
                },
              }),
            });
            console.log("📱 태블릿을 메인 화면으로 리셋");
          }

          // 고객 이력 탭으로 전환 시 고객 정보를 태블릿에 전송
          if (newTab === "history" && currentCustomer) {
            stompClient.publish({
              destination: "/app/send-to-session",
              body: JSON.stringify({
                sessionId: sessionId,
                type: "customer-info-display",
                data: {
                  customer: currentCustomer,
                  customerProducts: customerProducts,
                  timestamp: new Date().toISOString(),
                },
              }),
            });
            console.log("📱 태블릿에 고객 이력 정보 전송:", currentCustomer);
          }
        } else {
          console.warn(
            "⚠️ WebSocket 연결이 끊어져 있습니다. 탭 변경 메시지를 전송할 수 없습니다."
          );
        }
      } catch (error) {
        console.error("❌ 탭 변경 메시지 전송 실패:", error);
      }
    } else {
      console.warn("⚠️ WebSocket 클라이언트 또는 세션 ID가 없습니다.");
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testCustomers, setTestCustomers] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [privacyConsentSent, setPrivacyConsentSent] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // 화면 강제 업데이트용
  const [fieldValues, setFieldValues] = useState({}); // 필드 값들 (PC와 태블릿 동기화용)
  // 상품 가입에 필요한 4개 핵심 서식만 선별하는 유틸
  const filterEnrollmentForms = useCallback((forms) => {
    if (!Array.isArray(forms)) return [];

    // API에서 받은 4개 서식을 그대로 사용 (필터링 없이)
    console.log(
      "🔍 [EmployeeDashboard] 원본 서식들:",
      forms.map((f) => f?.formName)
    );
    console.log(
      "🔍 [EmployeeDashboard] 원본 서식 ID들:",
      forms.map((f) => f?.formId)
    );

    // 4개 서식을 그대로 반환
    const filtered = forms.slice(0, 4); // 최대 4개까지만

    console.log(
      "🔍 [EmployeeDashboard] 필터링된 서식:",
      filtered.map((f) => f?.formName)
    );

    return filtered;
  }, []);

  const [highlights, setHighlights] = useState([]); // 하이라이트 상태
  const [formCompletion, setFormCompletion] = useState(null); // 서식 완성도
  const [isSavingForm, setIsSavingForm] = useState(false); // 서식 저장 중 여부
  const [sttEnabled, setSttEnabled] = useState(false); // STT 활성화 여부
  const [sttTranscript, setSttTranscript] = useState(""); // STT 결과
  const [isRecording, setIsRecording] = useState(false); // 실제 녹음 중 여부
  const [recordingStartTime, setRecordingStartTime] = useState(null); // 녹음 시작 시간
  const [consultationId, setConsultationId] = useState(null); // 상담 세션 ID
  const [hasEmployeeVoiceProfile, setHasEmployeeVoiceProfile] = useState(false); // 행원 음성 프로필 존재 여부
  const [consultationHistory, setConsultationHistory] = useState([]); // 상담내역
  const [loadingConsultationHistory, setLoadingConsultationHistory] =
    useState(false); // 상담내역 로딩 상태
  const [selectedConsultation, setSelectedConsultation] = useState(null); // 선택된 상담내역
  const [showConsultationModal, setShowConsultationModal] = useState(false); // 상담내역 모달 표시 여부
  const [selectedProductForm, setSelectedProductForm] = useState(null); // 선택된 상품 서식
  const [showProductFormPage, setShowProductFormPage] = useState(false); // 상품 서식 페이지 표시 여부
  const [showSpeakerDemo, setShowSpeakerDemo] = useState(false); // 화자분리 분석 데모 표시 여부 (기본값 false)
  const [showRealtimeChat, setShowRealtimeChat] = useState(false); // 우측 상단 STT+메모 패널
  const [showCalculator, setShowCalculator] = useState(false); // 계산기 표시 여부
  const [showNewEmployeeGuide, setShowNewEmployeeGuide] = useState(false); // 신입행원 가이드라인 표시 여부
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false); // 개인정보 동의서 표시 여부
  const [privacyConsentGiven, setPrivacyConsentGiven] = useState(false); // 개인정보 동의 완료 여부

  // 서식 완성도 체크
  useEffect(() => {
    if (Object.keys(fieldValues).length > 0) {
      const completion = checkFormCompletion(fieldValues, "consent");
      setFormCompletion(completion);
      console.log("📊 PC 서식 완성도 업데이트:", completion);
    }
  }, [fieldValues]);

  // STT 토스트 메시지 음소거 및 기본 폼 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    console.log("🔇 STT 토스트 메시지 음소거 활성화");
    muteToasts(true);

    // 기본 상품의 폼 데이터 미리 로드 (시뮬데이터 방지)
    const loadDefaultForms = async () => {
      try {
        const response = await fetch(
          "http://13.209.3.0:8080/api/employee/products/P001_급여하나월복리적금/forms"
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data?.forms && Array.isArray(data.data.forms)) {
            setApiForms(data.data.forms);
            console.log(
              "✅ 기본 폼 데이터 미리 로드 완료:",
              data.data.forms.length
            );
          }
        }
      } catch (error) {
        console.warn("⚠️ 기본 폼 데이터 로드 실패:", error);
      }
    };

    loadDefaultForms();

    // 컴포넌트 언마운트 시 토스트 음소거 해제
    return () => {
      console.log("🔊 STT 토스트 메시지 음소거 해제");
      muteToasts(false);
    };
  }, []);

  // 현재 행원의 음성 프로필이 있는지 확인하는 함수
  const checkEmployeeVoiceProfile = useCallback(async () => {
    if (!employee?.id) return false;

    try {
      // 직원 ID로 음성 프로필 확인 (employee.id 또는 employee.employeeId)
      const employeeId = employee.id || employee.employeeId;
      console.log("🔍 음성 프로필 확인 중:", { employeeId, employee });

      // 백엔드 API로 음성 프로필 확인
      const response = await fetch(`/api/voice-profiles/check/${employeeId}`);
      if (!response.ok) {
        console.error("음성 프로필 확인 오류:", response.status);
        return false;
      }

      const result = await response.json();
      const hasProfile = result.success && result.hasProfile;
      console.log("🎤 음성 프로필 확인 결과:", hasProfile);
      return hasProfile; // 데이터가 있으면 true, 없으면 false
    } catch (err) {
      console.error("음성 프로필 확인 실패:", err);
      return false;
    }
  }, [employee?.id, employee?.employeeId]);

  // 상담내역 가져오기
  const fetchConsultationHistory = useCallback(async (customerId) => {
    if (!customerId) return;

    setLoadingConsultationHistory(true);
    try {
      const { data, error } = await supabase
        .from("consultation_history")
        .select(
          `
          *,
          consultation_messages (
            id,
            speaker_type,
            speaker_name,
            message_text,
            timestamp,
            confidence_score
          )
        `
        )
        .eq("customer_id", customerId)
        .order("consultation_date", { ascending: false });

      if (error) {
        console.error("상담내역 조회 오류:", error);
        return;
      }

      setConsultationHistory(data || []);
      console.log("✅ 상담내역 조회 완료:", data?.length || 0, "건");
    } catch (err) {
      console.error("상담내역 조회 실패:", err);
    } finally {
      setLoadingConsultationHistory(false);
    }
  }, []);

  // 행원 음성 프로필 존재 여부 확인
  useEffect(() => {
    if (employee?.id) {
      checkEmployeeVoiceProfile().then((hasProfile) => {
        setHasEmployeeVoiceProfile(hasProfile);
        // 음성프로필이 없으면 신입행원 가이드라인 표시
        if (!hasProfile) {
          setShowNewEmployeeGuide(true);
        }
      });
    }
  }, [employee?.id, checkEmployeeVoiceProfile]);

  // 고객이 변경될 때 상담내역 가져오기
  useEffect(() => {
    if (currentCustomer?.CustomerID) {
      fetchConsultationHistory(currentCustomer.CustomerID);
      // 동의서 전송 비활성화 - 고객 로그인 시 바로 녹음 시작
      console.log("🔍 고객 로그인됨 - 동의서 전송 생략, 자동 녹음 시작");
    }
  }, [currentCustomer?.CustomerID, fetchConsultationHistory]);

  // 녹음 시간 계산 함수
  const getRecordingDuration = () => {
    if (!recordingStartTime) return "00:00";
    const now = new Date();
    const diff = Math.floor((now - recordingStartTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Pyannote 방식 상담 종료 및 요약 업데이트
  const saveConsultationTranscript = async () => {
    if (!consultationId) {
      console.log("⚠️ 상담 세션 ID가 없어서 저장하지 않습니다.");
      return;
    }

    try {
      const durationSeconds = recordingStartTime
        ? Math.floor((new Date() - recordingStartTime) / 1000)
        : 0;

      console.log("📤 상담 세션 종료 및 요약 업데이트:", {
        consultationId,
        durationSeconds,
        summary: sttTranscript.substring(0, 500),
      });

      // 상담 세션 상태를 completed로 업데이트하고 요약 추가
      const { error } = await supabase
        .from("consultation_history")
        .update({
          status: "completed",
          duration_seconds: durationSeconds,
          summary: sttTranscript.substring(0, 500), // 요약은 처음 500자
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultationId);

      if (error) {
        console.error("❌ 상담 세션 업데이트 실패:", error);
        showToast("상담 내역 저장에 실패했습니다.", "error");
        return;
      }

      console.log("✅ 상담 세션 업데이트 완료");
      showToast("상담 내역이 저장되었습니다.", "success");

      // 상담 내역 새로고침
      if (currentCustomer?.CustomerID) {
        fetchConsultationHistory(currentCustomer.CustomerID);
      }

      // 상담 세션 ID 초기화
      setConsultationId(null);
    } catch (error) {
      console.error("❌ 상담 내역 저장 중 오류:", error);
      showToast("상담 내역 저장 중 오류가 발생했습니다.", "error");
    }
  };

  // 녹음 시간 실시간 업데이트
  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        // 강제 리렌더링을 위해 상태 업데이트
        setForceUpdate((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  // Pyannote 방식 상담 세션 생성
  const createConsultationSession = async () => {
    try {
      console.log("📋 상담 세션 생성 시작:", {
        customerId: currentCustomer?.CustomerID,
        employeeId: employee?.id || employee?.employeeId,
      });

      const { data, error } = await supabase
        .from("consultation_history")
        .insert({
          customer_id: currentCustomer?.CustomerID || "UNKNOWN",
          employee_id: employee?.id || employee?.employeeId || "UNKNOWN",
          consultation_date: new Date().toISOString(),
          status: "in_progress",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ 상담 세션 생성 실패:", error);
        return null;
      }

      console.log("✅ 상담 세션 생성됨:", data.id);
      setConsultationId(data.id);
      return data.id;
    } catch (err) {
      console.error("❌ 상담 세션 생성 오류:", err);
      return null;
    }
  };

  // Pyannote 방식 메시지 저장
  const saveMessageToConsultation = async (messageData) => {
    if (!consultationId) {
      console.log("⚠️ 상담 세션 ID가 없어서 메시지를 저장하지 않습니다.");
      return;
    }

    try {
      console.log("💾 메시지 저장 시도:", messageData);

      const { error } = await supabase.from("consultation_messages").insert({
        consultation_id: consultationId,
        speaker_type:
          messageData.speakerId === "SPEAKER_00" ? "employee" : "customer",
        speaker_name: messageData.speakerName,
        message_text: messageData.transcript,
        confidence_score: messageData.confidence || 0.0,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ 메시지 저장 실패:", error);
      } else {
        console.log("✅ 메시지 저장됨:", messageData.transcript);
      }
    } catch (err) {
      console.error("❌ 메시지 저장 오류:", err);
    }
  };

  // 개인정보 동의서 처리 함수
  // 고객 로그인 핸들러
  const handleCustomerLogin = async (customer) => {
    console.log("🔍 고객 로그인 처리:", customer);
    console.log("🔍 저장될 고객 정보:", JSON.stringify(customer, null, 2));
    setCurrentCustomer(customer);
    setIsLoadingCustomer(false);
    setShowCustomerLoginModal(false);

    // 동의서 전송 상태 초기화
    setPrivacyConsentSent(false);

    // 고객 정보 로드
    await fetchCustomerProducts(customer.CustomerID || customer.id);

    // 태블릿으로 고객 정보 전송
    if (stompClient && sessionId) {
      stompClient.publish({
        destination: "/app/send-message",
        body: JSON.stringify({
          sessionId: sessionId,
          type: "customer-login",
          data: customer,
        }),
      });
    }

    // 고객 로그인 성공 시 녹음 준비 (모달은 토글 버튼으로 제어)
    console.log("🎤 고객 로그인 성공 - 녹음 준비 완료");
    setSttEnabled(true);
    setRecordingStartTime(new Date());
    // STT 토스트 비활성화: 준비 완료 토스트 제거

    showToast(
      `${customer.Name || customer.name} 고객님 환영합니다!`,
      "success"
    );
  };
  const handlePrivacyConsent = async (consentGiven) => {
    try {
      if (consentGiven) {
        // 직원 ID 확인 및 로깅
        const employeeId =
          employee?.id || employee?.employeeId || employee?.employeeId;
        console.log("🔍 동의서 저장 시 직원 정보:", {
          employee,
          employeeId,
          customerId: currentCustomer?.CustomerID,
          customerName: currentCustomer?.Name,
        });

        if (!employeeId) {
          console.error("❌ 직원 ID가 없습니다:", employee);
          showToast("직원 정보를 찾을 수 없습니다.", "error");
          return;
        }

        if (!currentCustomer?.CustomerID) {
          console.error("❌ 고객 정보가 없습니다:", currentCustomer);
          showToast("고객 정보를 찾을 수 없습니다.", "error");
          return;
        }

        // 동의한 경우 히스토리에 저장
        const consentData = {
          customer_id: currentCustomer.CustomerID,
          customer_name: currentCustomer.Name, // Name (대문자)으로 수정
          employee_id: employeeId,
          employee_name: employee?.name || "직원",
          consent_type: "privacy_recording",
          consent_given: true,
          consent_date: new Date().toISOString(),
          form_data: {
            customer_name: currentCustomer.Name, // Name (대문자)으로 수정
            customer_id: currentCustomer.CustomerID,
            consent_type: "개인정보 수집 이용 동의서",
            consent_purpose: "음성 녹음 및 상담 분석",
            consent_items: [
              "개인정보 수집 이용",
              "음성 녹음",
              "상담 내용 분석",
              "AI 기반 상품 추천",
            ],
          },
        };

        console.log("📤 동의서 저장 시도:", consentData);

        // Supabase에 개인정보 동의서 저장 (별도 테이블)
        const { error } = await supabase.from("privacy_consent").insert([
          {
            customer_id: currentCustomer.CustomerID,
            customer_name: currentCustomer.Name,
            employee_id: employeeId,
            employee_name: employee?.name || "직원",
            consent_type: "privacy_recording",
            consent_given: true,
            consent_purpose: "음성 녹음 및 상담 분석",
            consent_items: [
              "개인정보 수집 이용",
              "음성 녹음",
              "상담 내용 분석",
              "AI 기반 상품 추천",
            ],
            retention_period: "상담 종료 후 3년간 보관 후 자동 삭제",
          },
        ]);

        if (error) {
          console.error("❌ 동의서 저장 실패:", error);
          showToast("동의서 저장에 실패했습니다.", "error");
          return;
        }

        console.log("✅ 개인정보 동의서 저장 완료");
        showToast("개인정보 동의가 완료되었습니다.", "success");

        // 동의 완료 후 자동 녹음 시작
        setPrivacyConsentGiven(true);
        setShowPrivacyConsent(false);

        // Pyannote 방식으로 상담 세션 생성
        await createConsultationSession();

        // STT 활성화 및 자동 녹음 시작
        setSttEnabled(true);
        setShowRealtimeChat(true); // RealtimeChat 패널 표시
        // setIsRecording(true); // PyannoteSTT 컴포넌트에서 자동으로 관리
        setRecordingStartTime(new Date());

        console.log("🎤 고객 로그인 시 STT 자동 활성화:", {
          sttEnabled: true,
          showPyannoteSTT: true,
          customer: currentCustomer?.Name,
        });
        // STT 토스트 비활성화: 시작 토스트 제거

        // 자동 녹음 시작 알림
        // STT 토스트 비활성화: 녹음 시작 알림 토스트 제거
      } else {
        // 동의하지 않은 경우
        setShowPrivacyConsent(false);
        showToast("개인정보 동의가 필요합니다.", "warning");
      }
    } catch (error) {
      console.error("❌ 개인정보 동의서 처리 오류:", error);
      showToast("동의서 처리 중 오류가 발생했습니다.", "error");
    }
  };

  // 상품 서식 조회 함수
  const fetchProductForm = async (productId, customerId) => {
    try {
      console.log("📋 상품 서식 조회:", { productId, customerId });

      // Supabase에서 해당 상품의 서식 데이터 조회
      const { data, error } = await supabase
        .from("form_submission")
        .select("*")
        .eq("product_id", productId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ 서식 조회 실패:", error);
        showToast("서식 조회에 실패했습니다.", "error");
        return;
      }

      if (data && data.length > 0) {
        // 가장 최근 서식을 선택하고 필드명 매핑
        const latestForm = data[0];
        const mappedForm = {
          ...latestForm,
          productName: latestForm.product_name,
          formName: latestForm.form_name,
          formType: latestForm.form_type,
          completionRate: latestForm.completion_rate,
          formData: latestForm.form_data, // form_data를 formData로 매핑
          createdAt: latestForm.created_at,
        };
        console.log("✅ 서식 조회 성공:", mappedForm);
        setSelectedProductForm(mappedForm);
        setShowProductFormPage(true);
      } else {
        console.log("⚠️ 해당 상품의 서식을 찾을 수 없습니다.");
        showToast("해당 상품의 서식을 찾을 수 없습니다.", "warning");
      }
    } catch (error) {
      console.error("❌ 상품 서식 조회 오류:", error);
      showToast("서식 조회 중 오류가 발생했습니다.", "error");
    }
  };

  // 서식 저장 함수 (백엔드 API 사용)
  const handleSaveForm = async () => {
    try {
      setIsSavingForm(true);

      const customerId = currentCustomer?.CustomerID || "C6660";
      const employeeId = "E001";
      const productId =
        selectedProduct?.productId || selectedProduct?.product_id || "PROD_001";
      const productName =
        selectedProduct?.productName || selectedProduct?.name || "하나금융상품";
      const formId = "consent_form"; // 기본값
      const formName = "개인정보 수집·이용 동의서"; // 기본값
      const formType = "consent";

      console.log("💾 서식 저장 시작:", {
        customerId,
        employeeId,
        productId,
        productName,
        formId,
        formName,
      });

      // 백엔드 API로 서식 데이터 저장
      const response = await fetch("/api/form-submission/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: `SUB_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          customerId: customerId,
          employeeId: employeeId,
          productId: productId,
          productName: productName,
          formId: formId,
          formName: formName,
          formType: formType,
          formData: JSON.stringify(fieldValues),
          completionRate: 100,
          status: "COMPLETED",
        }),
      });

      if (!response.ok) {
        throw new Error(`서식 저장 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ 백엔드 서식 저장 완료:", data);

      // 태블릿으로 완료 메시지 전송
      if (stompClient && sessionId && stompClient.connected) {
        const completionMessage = {
          type: "enrollment-completed",
          data: {
            message: "상품 가입이 완료되었습니다.",
            submissionId: data.data?.submissionId,
            productId: productId,
            productName: productName,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify(completionMessage),
        });

        console.log("📤 태블릿에 가입 완료 메시지 전송:", completionMessage);
      }

      alert("서식이 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("❌ 서식 저장 실패:", error);
      alert(`서식 저장에 실패했습니다: ${error.message}`);
    } finally {
      setIsSavingForm(false);
    }
  };
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // WebSocket 연결 함수
  const connectWebSocket = (sessionId, employee) => {
    console.log(
      "🔌 WebSocket 연결 함수 호출됨 - sessionId:",
      sessionId,
      "employee:",
      employee
    );
    const client = new Client({
      webSocketFactory: () => {
        const wsUrl = getWebSocketUrl();
        console.log("WebSocket 연결 시도:", wsUrl);
        return new SockJS(wsUrl);
      },
      connectHeaders: {},
      debug: function (str) {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      console.log("STOMP 연결 성공:", frame);
      console.log("🎉 WebSocket 연결 완료! 구독 시작합니다.");
      setStompClient(client);

      // 전역 STOMP 클라이언트 설정 (ActualBankForm에서 사용)
      window.stompClient = client;

      // 세션 ID 확인
      console.log("사용할 세션 ID:", sessionId);

      // 세션 참여
      client.publish({
        destination: "/app/join-session",
        body: JSON.stringify({
          sessionId: sessionId,
          userType: "employee",
          userId: employee.employeeId,
        }),
      });

      // 세션 메시지 구독 (태블릿과 통신용)
      const subscriptionTopic = "/topic/session/" + sessionId;
      console.log("🔍 직원 PC WebSocket 구독 시작:", subscriptionTopic);
      console.log("🔍 sessionId 값:", sessionId);
      console.log("🔍 WebSocket 클라이언트 상태:", client.connected);

      const subscription = client.subscribe(
        subscriptionTopic,
        function (message) {
          console.log("🎉 구독 성공! 메시지 수신됨");
          console.log("🔍 RAW 메시지 body:", message.body);
          const data = JSON.parse(message.body);
          console.log("🔍 직원이 세션 메시지 수신:", data);
          console.log("🔍 메시지 타입:", data.type);
          console.log("🔍 구독 토픽:", subscriptionTopic);
          console.log("🔍 실제 수신된 메시지 body:", message.body);
          // 메시지 타입별 처리
          switch (data.type) {
            case "tablet-connected":
              console.log("태블릿 연결됨:", data);
              break;
            case "customer-selected":
              console.log("태블릿에서 고객 선택됨:", data);
              if (data.customerData) {
                setCurrentCustomer(data.customerData);
                console.log(
                  "✅ 직원 화면에 고객 정보 업데이트:",
                  data.customerData.name
                );
              }
              break;
            case "customer-info-confirmed":
              console.log("태블릿에서 고객 정보 확인 완료:", data);
              break;
            case "customer-info-display":
              console.log("고객 정보 표시 메시지 수신:", data);
              // 태블릿에서 고객 정보 표시 요청을 받았을 때의 처리
              if (data.data && data.data.customer) {
                console.log("고객 정보:", data.data.customer);
              }
              break;
            case "privacy-consent":
              console.log("🎉 태블릿에서 개인정보 동의 응답 수신:", data);
              console.log("🔍 동의 여부:", data.consentGiven);
              console.log("🔍 data.consentGiven:", data.data?.consentGiven);
              console.log("🔍 전체 데이터 구조:", Object.keys(data));

              // true면 자동으로 녹음 시작
              const consentValue = data.consentGiven || data.data?.consentGiven;
              if (consentValue === true) {
                console.log("✅ 동의 완료 - 자동 녹음 시작");
                handlePrivacyConsent(true);
              } else {
                console.log("❌ 동의 거부 또는 데이터 없음");
                handlePrivacyConsent(false);
              }
              break;
            case "FIELD_INPUT_COMPLETED":
              console.log("태블릿에서 필드 입력 완료:", data);
              // 폼 필드 업데이트 처리
              if (data.field && window.updateFormField) {
                window.updateFormField(data.field, data.value);
              }
              break;
            case "product_recommendation":
              console.log("🎯 AI 추천 결과 수신:", data);
              if (data.data) {
                setAiRecommendations(data.data.recommendations || []);
                setRecommendationIntent(data.data.intent || "일반상담");
                setShowAiRecommendations(true);

                // 고객 태블릿으로 AI 추천 결과 전송
                if (stompClient && stompClient.connected && sessionId) {
                  const tabletMessage = {
                    type: "ai-recommendation",
                    data: {
                      recommendations: data.data.recommendations || [],
                      confidence: data.data.confidence || 0,
                      intent: data.data.intent || "일반상담",
                      customerName: currentCustomer?.name || "고객님",
                      timestamp: new Date().toISOString(),
                    },
                  };

                  stompClient.publish({
                    destination: `/topic/session/tablet_main`,
                    body: JSON.stringify(tabletMessage),
                  });

                  console.log(
                    "📱 [행원] 고객 태블릿으로 AI 추천 결과 전송:",
                    tabletMessage
                  );
                }

                // 추천 결과를 채팅 메시지로도 추가
                const recommendationMessage = {
                  id: Date.now(),
                  type: "ai_recommendation",
                  timestamp: new Date().toISOString(),
                  speaker: "ai",
                  text: `고객님의 요청에 따라 ${
                    data.data.recommendations?.length || 0
                  }개의 상품을 추천드립니다.`,
                  intent: data.data.intent,
                  recommendations: data.data.recommendations,
                  confidence: data.data.confidence,
                };

                setChatMessages((prev) => [...prev, recommendationMessage]);

                // 토스트 알림 표시
                if (window.showToast) {
                  window.showToast(
                    `🎯 ${
                      data.data.recommendations?.length || 0
                    }개 상품 추천 완료`,
                    "success"
                  );
                }

                // 태블릿으로도 추천 결과 전달 (탭 전환 + 대표 추천 1건)
                if (stompClient && stompClient.connected && sessionId) {
                  try {
                    stompClient.publish({
                      destination: "/app/send-message",
                      body: JSON.stringify({
                        sessionId: sessionId,
                        type: "tab-change",
                        data: { activeTab: "customer" },
                        timestamp: Date.now(),
                      }),
                    });
                    const topProduct =
                      (data.data.recommendations || [])[0] || null;
                    if (topProduct) {
                      stompClient.publish({
                        destination: "/app/send-message",
                        body: JSON.stringify({
                          sessionId: sessionId,
                          type: "product-recommendation",
                          data: { product: topProduct },
                          timestamp: Date.now(),
                        }),
                      });
                      console.log(
                        "📱 태블릿으로 대표 추천 전송 완료 (WS 수신 경로)"
                      );
                    }
                  } catch (e) {
                    console.warn("태블릿 추천 결과 전송 실패:", e);
                  }
                }
              }
              break;
            // case "field-input-completed": // 중복 제거 - 아래에서 처리

            case "field-focus":
              console.log("🔍 직원이 필드 포커스 메시지 수신:", data);
              console.log("🔍 하이라이트와 동일한 방식으로 처리");

              // 하이라이트와 동일한 방식으로 처리 - data.data에서 필드 정보 추출
              if (data.data && data.data.fieldId) {
                const fieldId = data.data.fieldId;
                const fieldLabel = data.data.fieldLabel;
                const fieldType = data.data.fieldType;
                const fieldPlaceholder = data.data.fieldPlaceholder;
                const formIndex = data.data.formIndex;
                const formName = data.data.formName;

                console.log("✅ 필드 포커스 정보 (data.data):", {
                  fieldId,
                  fieldLabel,
                  fieldType,
                  formIndex,
                  formName,
                });

                // PC에서 필드 포커스 상태 업데이트 (필요시)
                // 현재는 로그만 출력하고 있음
              } else if (data.fieldId && data.fieldLabel) {
                // 백업: 직접 필드 정보가 있는 경우
                const fieldId = data.fieldId;
                const fieldLabel = data.fieldLabel;
                const fieldType = data.fieldType;
                const fieldPlaceholder = data.fieldPlaceholder;
                const formIndex = data.formIndex;
                const formName = data.formName;

                console.log("✅ 필드 포커스 정보 (직접):", {
                  fieldId,
                  fieldLabel,
                  fieldType,
                  formIndex,
                  formName,
                });
              } else {
                console.log("❌ 필드 정보를 찾을 수 없음");
                console.log("❌ data.data:", data.data);
                console.log("❌ data:", data);
              }
              break;

            case "field-input-sync":
              console.log(
                "📝 태블릿에서 필드 입력 실시간 동기화 메시지 수신:",
                data
              );
              // 실시간 동기화는 필드 값만 업데이트하고 저장하지 않음
              if (
                data.data &&
                data.data.fieldId &&
                data.data.value !== undefined
              ) {
                setFieldValues((prev) => ({
                  ...prev,
                  [data.data.fieldId]:
                    typeof data.data.value === "object"
                      ? JSON.stringify(data.data.value)
                      : data.data.value,
                }));
                console.log("📝 실시간 필드 값 동기화:", {
                  fieldId: data.data.fieldId,
                  value: data.data.value,
                });
              }
              break;

            case "field-input-complete":
              console.log("📝 태블릿에서 필드 입력 완료 메시지 수신:", data);
              console.log("📝 전체 메시지 데이터:", data);
              console.log("📝 메시지 타입:", data.type);
              console.log("📝 메시지 데이터:", data.data);

              // 기존 메시지 구조 처리
              let existingFieldId, existingFieldValue, existingFieldLabel;

              if (data.data && data.data.value) {
                // 새로운 구조
                existingFieldId = data.data.fieldId || "unknown";
                existingFieldValue = data.data.value;
                existingFieldLabel = data.data.fieldName || "알 수 없는 필드";
              } else {
                // 기존 구조
                existingFieldId = data.fieldId || "unknown";
                existingFieldValue = data.value || data.fieldValue || "";
                existingFieldLabel =
                  data.fieldLabel || data.fieldName || "알 수 없는 필드";
              }

              console.log(
                `✅ 필드 입력 완료: ${existingFieldLabel} = ${existingFieldValue}`
              );

              // PC 화면에서 해당 필드에 입력된 값 표시
              console.log(
                "🔍 필드 업데이트 시작 - enrollmentData:",
                enrollmentData
              );
              console.log("🔍 현재 폼 인덱스:", currentFormIndex);

              // 전역 변수에서 enrollmentData 가져오기 (React 상태가 null일 때)
              const currentEnrollmentData =
                enrollmentData || window.enrollmentData;
              const currentFormIdx =
                currentFormIndex || window.currentFormIndex;

              console.log(
                "🔍 전역 변수 enrollmentData:",
                window.enrollmentData
              );
              console.log("🔍 사용할 enrollmentData:", currentEnrollmentData);

              if (
                currentEnrollmentData &&
                currentEnrollmentData.forms &&
                currentEnrollmentData.forms[currentFormIdx]
              ) {
                console.log("✅ enrollmentData와 forms 존재 확인");

                // 현재 서식의 필드 데이터 업데이트
                const updatedForms = [...currentEnrollmentData.forms];
                const currentForm = updatedForms[currentFormIdx];

                console.log("🔍 현재 폼:", currentForm);
                console.log("🔍 폼 스키마:", currentForm.formSchema);

                // React 서식인 경우 (formSchema가 없거나 undefined)
                if (currentForm.isReactForm || !currentForm.formSchema) {
                  console.log("🔍 React 서식 감지 - fieldValues 직접 업데이트");

                  // fieldValues 상태 업데이트 (PC 화면 실시간 동기화용)
                  setFieldValues((prev) => ({
                    ...prev,
                    [existingFieldId]:
                      typeof existingFieldValue === "object"
                        ? JSON.stringify(existingFieldValue)
                        : existingFieldValue,
                  }));

                  console.log(
                    `✅ React 서식 필드 "${existingFieldLabel}" 값 "${existingFieldValue}"로 업데이트 완료`
                  );

                  // PC 화면 강제 업데이트를 위한 상태 변경
                  setForceUpdate((prev) => prev + 1);
                } else {
                  // 기존 PDF 서식인 경우
                  try {
                    const schema = JSON.parse(currentForm.formSchema);
                    console.log("🔍 파싱된 스키마:", schema);
                    console.log("🔍 스키마 필드들:", schema.fields);

                    if (schema.fields) {
                      console.log("🔍 찾을 필드 ID:", existingFieldId);
                      const fieldIndex = schema.fields.findIndex(
                        (f) => f.id === existingFieldId
                      );
                      console.log("🔍 찾은 필드 인덱스:", fieldIndex);

                      if (fieldIndex !== -1) {
                        console.log("🔍 필드 찾음 - 업데이트 시작");
                        // 필드값 업데이트
                        schema.fields[fieldIndex].value = existingFieldValue;
                        currentForm.formSchema = JSON.stringify(schema);

                        // 상태 업데이트
                        const newEnrollmentData = {
                          ...currentEnrollmentData,
                          forms: updatedForms,
                        };
                        setEnrollmentData(newEnrollmentData);

                        // fieldValues 상태도 업데이트 (PC 화면 실시간 동기화용)
                        setFieldValues((prev) => ({
                          ...prev,
                          [existingFieldId]:
                            typeof existingFieldValue === "object"
                              ? JSON.stringify(existingFieldValue)
                              : existingFieldValue,
                        }));

                        // 전역 변수도 업데이트
                        window.enrollmentData = newEnrollmentData;

                        console.log(
                          `✅ PDF 서식 필드 "${existingFieldLabel}" 값 "${existingFieldValue}"로 업데이트 완료`
                        );

                        // PC 화면 강제 업데이트를 위한 상태 변경
                        setForceUpdate((prev) => prev + 1);

                        // 필드 업데이트 후 즉시 화면 반영을 위한 로그
                        console.log("🔄 PC 화면 업데이트 트리거됨");
                      } else {
                        console.log(
                          "❌ 필드를 찾을 수 없음 - existingFieldId:",
                          existingFieldId
                        );
                        console.log(
                          "❌ 사용 가능한 필드 ID들:",
                          schema.fields.map((f) => f.id)
                        );
                      }
                    } else {
                      console.log("❌ 스키마에 fields가 없음");
                    }
                  } catch (e) {
                    console.error("서식 스키마 파싱 오류:", e);
                  }
                }
              } else {
                console.log("❌ enrollmentData 또는 forms가 없음");
                console.log("❌ enrollmentData:", enrollmentData);
                console.log("❌ currentFormIndex:", currentFormIndex);
              }
              break;
            case "product-enrollment":
              console.log("🔍 PC에서 product-enrollment 메시지 수신:", data);
              console.log("🔍 PC에서 data.action:", data.action);
              console.log("🔍 PC에서 data.data:", data.data);
              if (data.action === "start_enrollment" && data.data) {
                // 모든 상품에서 우리가 만든 React 서식 두 개를 무조건 표시
                console.log("🔍 상품 가입 시작 - 우리가 만든 React 서식 사용");
                console.log("🔍 상품 정보:", data.data);

                // 우리가 만든 React 서식 두 개를 사용
                const enrollmentWithReactForms = {
                  ...data.data,
                  forms: [
                    {
                      formId: "CONSENT-FORM",
                      formName: "개인정보 동의서",
                      formType: "consent",
                      isReactForm: true, // React 서식임을 표시
                    },
                    {
                      formId: "APPLICATION-FORM",
                      formName: "은행거래신청서",
                      formType: "application",
                      isReactForm: true, // React 서식임을 표시
                    },
                  ],
                };

                setEnrollmentData(enrollmentWithReactForms);
                setCurrentFormIndex(0);
                handleTabChange("pdf-forms"); // 서식 작성 탭으로 전환
                console.log("✅ 우리가 만든 React 서식 2개 설정 완료");
              }
              break;
            case "product-description":
              console.log("🔍 직원이 상품설명서 동기화 메시지 수신:", data);
              // 상품설명서 동기화 메시지는 별도 처리하지 않음 (이미 PC에서 처리됨)
              break;
            case "screen-highlight":
              console.log(
                "🔍 직원이 화면 하이라이트 동기화 메시지 수신:",
                data
              );
              if (data.data && data.data.highlight) {
                const highlight = data.data.highlight;
                console.log("✅ 하이라이트 추가:", highlight);
                setHighlights((prev) => {
                  const updated = [...prev, highlight];
                  console.log("📝 하이라이트 배열 업데이트:", updated);
                  return updated;
                });
              }
              break;
            case "screen-updated":
              console.log("🔍 직원이 화면 업데이트 메시지 수신:", data.data);
              // screen-updated 메시지는 태블릿으로의 전달용이므로 별도 처리하지 않음
              break;
            case "field-input-completed":
              console.log("🔍 직원이 필드 입력 완료 메시지 수신:", data);
              // 백엔드에서 직접 필드 정보를 전달하므로 data.data가 아닌 직접 접근
              const inputFieldId =
                data.fieldId || (data.data && data.data.fieldId);
              const inputFieldValue =
                data.fieldValue || (data.data && data.data.fieldValue);

              if (inputFieldId && inputFieldValue !== undefined) {
                console.log(
                  "✅ 필드 값 업데이트:",
                  inputFieldId,
                  inputFieldValue
                );

                // PC의 fieldValues 상태 업데이트
                const updatedFieldValues = {
                  ...fieldValues,
                  [inputFieldId]: inputFieldValue,
                };
                setFieldValues(updatedFieldValues);

                // 태블릿에 업데이트된 필드 값 동기화 메시지 전송
                if (stompClient && stompClient.connected) {
                  stompClient.publish({
                    destination: "/topic/session/tablet_main",
                    body: JSON.stringify({
                      type: "field-values-sync",
                      data: {
                        fieldValues: updatedFieldValues,
                        updatedField: {
                          fieldId: inputFieldId,
                          fieldValue: inputFieldValue,
                        },
                      },
                      timestamp: new Date().toISOString(),
                    }),
                  });
                  console.log("📤 태블릿에 필드 값 동기화 메시지 전송:", {
                    fieldId: inputFieldId,
                    fieldValue: inputFieldValue,
                  });
                }

                console.log("✅ PC fieldValues 상태 업데이트 완료");
              }
              break;
            default:
              console.log("알 수 없는 메시지 타입:", data.type);
              break;
          }
        }
      );

      console.log("직원 세션 참여:", sessionId);

      // 직원 PC는 이미 /topic/session/tablet_main을 구독하고 있음 (라인 746)
      // 중복 구독 제거 - 기존 구독에서 privacy-consent-response 처리됨
      console.log("🔍 직원 PC WebSocket 연결 상태:", client.connected);
    };

    client.onStompError = function (frame) {
      console.error("STOMP 오류:", frame.headers["message"]);
      console.error("연결 실패 - 재연결 시도 중...");
    };

    client.onWebSocketClose = function (event) {
      console.warn("WebSocket 연결이 끊어졌습니다:", event);
      setStompClient(null);
    };

    client.onWebSocketError = function (error) {
      console.error("WebSocket 오류:", error);
    };

    client.activate();
    return client;
  };

  // 태블릿에 고객 정보 전송
  const sendCustomerInfoToTablet = (data) => {
    console.log("=== 메시지 전송 시작 ===");
    console.log("stompClient 상태:", !!stompClient);
    console.log("stompClient.connected:", stompClient?.connected);
    console.log("sessionId:", sessionId);
    console.log("받은 데이터:", data);
    console.log("현재 시간:", new Date().toLocaleTimeString());

    if (stompClient && sessionId && stompClient.connected) {
      let messagePayload;

      // 상품 추천인 경우와 고객 정보인 경우를 구분
      if (data && data.type === "product-description") {
        messagePayload = {
          sessionId: sessionId,
          type: "product-recommendation",
          data: {
            product: data.data,
            timestamp: Date.now(),
          },
        };
        console.log("상품 추천 메시지 전송");
      } else {
        // 고객 정보인 경우
        messagePayload = {
          sessionId: sessionId,
          type: "customer-info-display",
          data: {
            customer: data,
            timestamp: Date.now(),
          },
        };
        console.log("고객 정보 메시지 전송");
      }

      console.log(
        "전송할 메시지 페이로드:",
        JSON.stringify(messagePayload, null, 2)
      );
      console.log("전송 대상 토픽:", `/app/send-to-session`);
      console.log("실제 브로드캐스트될 토픽:", `/topic/session/tablet_main`);

      try {
        stompClient.publish({
          destination: "/app/send-to-session",
          body: JSON.stringify(messagePayload),
        });

        console.log("✅ 메시지 전송 완료");
        console.log("전송된 세션 ID:", sessionId);

        if (data && data.type === "product-description") {
          showToast("상품 정보가 태블릿에 전송되었습니다!", "success");
        } else {
          showToast("고객 정보가 태블릿에 전송되었습니다!", "success");
        }
      } catch (error) {
        console.error("❌ 메시지 전송 실패:", error);
        showToast("메시지 전송에 실패했습니다: " + error.message, "error");
      }
    } else {
      console.error("❌ 연결 상태 확인:");
      console.error("- stompClient 존재:", !!stompClient);
      console.error("- sessionId 존재:", !!sessionId, "값:", sessionId);
      console.error("- stompClient 활성화:", stompClient?.active);
      showToast(
        "태블릿이 연결되어 있지 않습니다. 태블릿 연결을 확인해주세요.",
        "error"
      );
    }
  };
  useEffect(() => {
    // 로그인된 직원 정보 확인
    const employeeData = localStorage.getItem("employee");
    const sessionData = localStorage.getItem("sessionId");

    // 로그인 정보가 없으면 로그인 페이지로 리다이렉트
    if (!employeeData || !sessionData) {
      console.log("로그인 정보 없음, 로그인 페이지로 이동");
      localStorage.removeItem("employee");
      localStorage.removeItem("sessionId");
      navigate("/employee/login");
      return;
    }

    try {
      const employee = JSON.parse(employeeData);
      setEmployee(employee);
      setSessionId(sessionData);

      // 로그인 직후 고객 신분증 인식 화면으로 설정
      setActiveTab("customer");
      setCurrentCustomer(null);
      console.log("✅ 직원 로그인 완료 - 고객 신분증 인식 화면으로 설정");
    } catch (error) {
      console.error("직원 정보 파싱 오류:", error);
      localStorage.removeItem("employee");
      localStorage.removeItem("sessionId");
      navigate("/employee/login");
      return;
    }

    // URL 파라미터에서 OCR로 로그인한 고객 정보 확인
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("customerId");
    const customerName = urlParams.get("customerName");

    if (customerId && customerName) {
      console.log("OCR로 로그인한 고객 정보:", { customerId, customerName });

      // 고객 상세 정보를 데이터베이스에서 가져오기
      const fetchCustomerDetails = async () => {
        setLoadingCustomerProducts(true);
        try {
          const response = await axios.get(
            `http://13.209.3.0:8080/api/employee/customers/${customerId}`
          );
          if (response.data && response.data.success) {
            const customerData = response.data.data;
            setCurrentCustomer({
              CustomerID: customerData.customerId,
              Name: customerData.name,
              Phone: customerData.contactNumber || customerData.phone || "",
              Age: customerData.age || "",
              Address: customerData.address || "",
              IdNumber: "******-*******", // 보안상 마스킹
              Income: customerData.monthlyIncome || "",
              Assets: customerData.totalAssets || "",
              InvestmentGoal: customerData.investmentGoal || "",
              RiskTolerance: customerData.riskTolerance || "",
              InvestmentPeriod: customerData.investmentPeriod || "",
            });
            console.log("고객 상세 정보 로드 완료:", customerData);

            // 고객 상품 정보도 함께 가져오기
            if (customerData.products && customerData.products.length > 0) {
              // 금리 순으로 정렬 (내림차순)
              const sortedProducts = customerData.products.sort(
                (a, b) => (b.interestRate || 0) - (a.interestRate || 0)
              );
              setCustomerProducts(sortedProducts);
              console.log("고객 상품 정보 (금리 순):", sortedProducts);
            }

            showToast(
              "고객 정보 로드 완료! 👤",
              `${customerData.name} 고객의 정보가 성공적으로 로드되었습니다.`,
              4000
            );
          }
        } catch (error) {
          console.error("고객 정보 조회 실패:", error);
        } finally {
          setLoadingCustomerProducts(false);
        }
      };

      fetchCustomerDetails();

      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 직원별 세션 ID 생성
    const finalSessionId = employee
      ? `employee_${employee.employeeId}_tablet`
      : "tablet_main";
    setSessionId(finalSessionId);

    if (!sessionData) {
      localStorage.setItem("sessionId", finalSessionId);
    }

    const client = connectWebSocket(finalSessionId, employee);

    // 테스트 고객 목록 가져오기
    fetchTestCustomers();

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [navigate]);

  useEffect(() => {
    console.log("🔍 localStorage 고객 정보 복원 비활성화됨");
    setIsLoadingCustomer(false);
  }, []);
  useEffect(() => {
    if (!isLoadingCustomer) {
      console.log("🔍 currentCustomer 상태 변경됨:", currentCustomer);

      if (currentCustomer) {
        const customerData = JSON.stringify(currentCustomer);
        localStorage.setItem("currentCustomer", customerData);
        console.log("✅ 고객 정보가 localStorage에 저장됨:", customerData);
        console.log(
          "✅ 저장된 고객명:",
          currentCustomer.Name || currentCustomer.name
        );
      } else {
        localStorage.removeItem("currentCustomer");
        console.log("🗑️ 고객 정보가 localStorage에서 제거됨");
      }
    }
  }, [currentCustomer, isLoadingCustomer]);
  useEffect(() => {
    console.log("🔍 enrollmentData 상태 변경됨:", enrollmentData);
    if (enrollmentData) {
      console.log("✅ enrollmentData 설정 완료:");
      console.log("  - productId:", enrollmentData.productId);
      console.log("  - productName:", enrollmentData.productName);
      console.log("  - forms 개수:", enrollmentData.forms?.length || 0);
      console.log("  - currentFormIndex:", enrollmentData.currentFormIndex);

      // 전역 변수에 React 상태 동기화
      window.enrollmentData = enrollmentData;
      window.currentFormIndex = currentFormIndex;
      console.log("🌐 전역 변수 동기화 완료");

      // 고객 정보로 fieldValues 자동 채우기
      if (
        currentCustomer &&
        enrollmentData.forms &&
        enrollmentData.forms.length > 0
      ) {
        console.log("🔍 고객 정보로 fieldValues 자동 채우기 시작");
        const autoFilledValues = {};

        // 모든 폼의 필드에 대해 고객 정보 매핑
        enrollmentData.forms.forEach((form) => {
          if (form.fields) {
            form.fields.forEach((field) => {
              const fieldId = field.id;

              // 고객 정보 매핑
              switch (fieldId) {
                case "customer_name":
                case "customerName":
                  autoFilledValues[fieldId] =
                    currentCustomer.Name || currentCustomer.name || "";
                  break;
                case "customer_id":
                case "customerId":
                  autoFilledValues[fieldId] =
                    currentCustomer.CustomerID ||
                    currentCustomer.customerId ||
                    "";
                  break;
                case "phone":
                case "contactNumber":
                  autoFilledValues[fieldId] =
                    currentCustomer.Phone ||
                    currentCustomer.contactNumber ||
                    "";
                  break;
                case "address":
                  autoFilledValues[fieldId] =
                    currentCustomer.Address || currentCustomer.address || "";
                  break;
                case "email":
                case "customerEmail":
                  autoFilledValues[fieldId] =
                    currentCustomer.Email || currentCustomer.email || "";
                  break;
                case "consentDate":
                case "applicationDate":
                case "confirmationDate":
                  autoFilledValues[fieldId] = new Date()
                    .toISOString()
                    .split("T")[0]; // 오늘 날짜
                  break;
                default:
                  // 다른 필드는 빈 문자열로 초기화
                  if (!autoFilledValues[fieldId]) {
                    autoFilledValues[fieldId] = "";
                  }
              }
            });
          }
        });

        console.log("✅ 자동 채워진 fieldValues:", autoFilledValues);
        setFieldValues(autoFilledValues);
      }
    }
  }, [enrollmentData, currentFormIndex, currentCustomer]);

  useEffect(() => {
    if (forceUpdate > 0) {
      console.log("🔄 PC 화면 강제 업데이트 실행:", forceUpdate);
      setForceUpdate(0); // 초기화
    }
  }, [forceUpdate]);

  const fetchCustomerProducts = async (customerId) => {
    if (!customerId) return;

    setLoadingCustomerProducts(true);
    try {
      const response = await axios.get(
        `/api/employee/customers/${customerId}/products`
      );

      let backendProducts = [];
      if (response.data.success) {
        backendProducts = Array.isArray(response.data.data?.products)
          ? response.data.data.products
          : [];
        console.log("백엔드 고객 상품 정보 로드 완료:", backendProducts);
      } else {
        console.error(
          "백엔드 고객 상품 정보 로드 실패:",
          response.data.message
        );
      }

      const { data: formSubmissions, error } = await supabase
        .from("form_submission")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase 상품 가입 이력 조회 실패:", error);
      } else {
        console.log("Supabase 상품 가입 이력 조회 완료:", formSubmissions);
      }

      const combinedProducts = [...backendProducts];

      if (formSubmissions && formSubmissions.length > 0) {
        const enrollmentHistory = formSubmissions.map((submission, index) => ({
          productId: submission.product_id,
          productName: submission.product_name,
          enrollmentDate: submission.created_at,
          formType: submission.form_type,
          formName: submission.form_name,
          status: submission.status,
          completionRate: submission.completion_rate,
          submissionId: submission.submission_id,
          isEnrollmentHistory: true, // 가입 이력임을 표시
          id: `enrollment_${submission.id}`, // 고유 ID
        }));

        combinedProducts.push(...enrollmentHistory);
        console.log("결합된 상품 정보:", combinedProducts);
      }

      setCustomerProducts(combinedProducts);
    } catch (error) {
      console.error("고객 상품 정보 로드 중 오류:", error);
      setCustomerProducts([]);
    } finally {
      setLoadingCustomerProducts(false);
    }
  };

  const fetchTestCustomers = async () => {
    console.log("실제 고객 데이터를 로드합니다...");

    try {
      const response = await axios.get(
        "http://13.209.3.0:8080/api/employee/customers"
      );
      if (response.data.success) {
        // API 응답 형태를 기존 코드와 맞추기 위해 변환
        const testCustomerData = response.data.data.map((customer) => ({
          customer_id: customer.customerId,
          name: customer.name,
          age: customer.age,
          phone: customer.phone || customer.contactNumber,
          address: customer.address,
          gender: customer.gender,
          registrationDate: customer.registrationDate,
          dateOfBirth: customer.dateOfBirth,
          // 상품 정보 추가
          products: customer.products || [],
          productSummary: customer.productSummary || {
            totalAssets: 0,
            totalDebts: 0,
            netAssets: 0,
            totalProducts: 0,
            totalDepositProducts: 0,
            totalLoanProducts: 0,
            totalInvestmentProducts: 0,
            averageInterestRate: 0.0,
            totalMonthlyPayment: 0,
          },
          // 기본값 설정
          income: 0,
          assets: customer.productSummary?.totalAssets || 0,
          investment_goal: "자산 증식",
          risk_tolerance: "보통",
          investment_period: "중장기",
          id_number: customer.customerId,
        }));

        setTestCustomers(testCustomerData);
        console.log(
          "실제 고객 데이터 로드 완료:",
          testCustomerData.length,
          "명"
        );
      } else {
        console.error("고객 데이터 로드 실패:", response.data.message);
      }
    } catch (error) {
      console.error("고객 데이터 로드 중 오류:", error);
      // 오류 시 기본 테스트 데이터 사용
      const fallbackData = [
        {
          customer_id: "C001",
          name: "김철수",
          age: 35,
          phone: "010-1234-5678",
          address: "서울시 강남구 역삼동",
          income: 50000000,
          assets: 100000000,
          investment_goal: "주택 구매",
          risk_tolerance: "medium",
          investment_period: 60,
          id_number: "850315-1******",
        },
      ];
      setTestCustomers(fallbackData);
    }
  };

  const selectTestCustomer = async (customerId) => {
    console.log("selectTestCustomer 호출됨 - customerId:", customerId);
    setLoading(true);
    try {
      // API에서 실제 고객 데이터 가져오기
      const response = await axios.get(
        `http://13.209.3.0:8080/api/employee/customers/${customerId}`
      );

      if (response.data.success) {
        const backendCustomerData = response.data.data;
        console.log("백엔드에서 가져온 고객 데이터:", backendCustomerData);

        // 백엔드 응답을 기존 형태로 변환
        const customerData = {
          CustomerID: backendCustomerData.customerId,
          Name: backendCustomerData.name,
          Age: backendCustomerData.age,
          Phone: backendCustomerData.phone || backendCustomerData.contactNumber,
          Address: backendCustomerData.address,
          Gender: backendCustomerData.gender,
          RegistrationDate: backendCustomerData.registrationDate,
          DateOfBirth: backendCustomerData.dateOfBirth,
          IdNumber: backendCustomerData.customerId || "******-*******",
          Income: 0, // 기본값
          Assets: backendCustomerData.productSummary?.totalAssets || 0,
          InvestmentGoal: "자산 증식", // 기본값
          RiskTolerance: "보통", // 기본값
          InvestmentPeriod: "중장기", // 기본값
          // 상품 정보 추가
          productSummary: backendCustomerData.productSummary,
          products: Array.isArray(backendCustomerData.products)
            ? backendCustomerData.products
            : [],
        };

        console.log("변환된 고객 데이터:", customerData);

        setCurrentCustomer(customerData);
        setShowCustomerSelect(false);

        // 고객 상품 정보 가져오기
        await fetchCustomerProducts(customerData.CustomerID);

        // Socket을 통해 고객 태블릿에 정보 전송
        if (stompClient && sessionId && stompClient.connected) {
          console.log("고객 정보를 태블릿에 전송합니다...");

          // 고객 정보 업데이트 이벤트 전송
          stompClient.publish({
            destination: "/app/customer-info-update",
            body: JSON.stringify({
              sessionId: sessionId,
              ...customerData,
            }),
          });

          // OCR 결과 이벤트도 전송 (호환성을 위해)
          stompClient.publish({
            destination: "/app/send-message",
            body: JSON.stringify({
              sessionId: sessionId,
              customerData: customerData,
            }),
          });
        } else {
          console.error("Socket 또는 세션 ID가 없습니다!");
        }

        await createConsultationSession(customerData.CustomerID);
      } else {
        alert("고객 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("테스트 고객 선택 오류:", error);
      alert("고객 선택에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("employee");
    if (stompClient && stompClient.active) stompClient.deactivate();
    navigate("/employee/login");
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Base64를 Blob으로 변환
      const byteCharacters = atob(imageSrc.split(",")[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      processOCR(blob);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processOCR(file);
    }
  };

  const processOCR = async (imageFile) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("idCard", imageFile);

      const response = await axios.post("/api/ocr/id-card", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success && response.data.customer) {
        const ocrCustomerData = response.data.customer;

        const transformedOcrData = {
          CustomerID: ocrCustomerData.CustomerID || ocrCustomerData.customerId,
          Name: ocrCustomerData.Name || ocrCustomerData.name,
          Phone: ocrCustomerData.ContactNumber || ocrCustomerData.phone,
          Age: ocrCustomerData.Age || ocrCustomerData.age,
          Address: ocrCustomerData.Address || ocrCustomerData.address,
          IdNumber:
            ocrCustomerData.IDNumber ||
            ocrCustomerData.IdNumber ||
            ocrCustomerData.idNumber ||
            "******-*******",
          Income: ocrCustomerData.Income || ocrCustomerData.income,
          Assets: ocrCustomerData.Assets || ocrCustomerData.assets,
          InvestmentGoal:
            ocrCustomerData.InvestmentGoal || ocrCustomerData.investmentGoal,
          RiskTolerance:
            ocrCustomerData.RiskTolerance || ocrCustomerData.riskTolerance,
          InvestmentPeriod:
            ocrCustomerData.InvestmentPeriod ||
            ocrCustomerData.investmentPeriod,
        };

        setCurrentCustomer(transformedOcrData);
        console.log("OCR 고객 데이터 변환 완료:", transformedOcrData);

        // Socket을 통해 고객 태블릿에 정보 전송
        if (stompClient && sessionId && stompClient.connected) {
          stompClient.publish({
            destination: "/app/send-message",
            body: JSON.stringify({
              sessionId: sessionId,
              customerData: transformedOcrData,
            }),
          });
        }

        await createConsultationSession(transformedOcrData.CustomerID);
      } else {
        // OCR은 성공했지만 고객을 찾지 못한 경우
        const extractedInfo = response.data.extracted_info;
        if (extractedInfo) {
          alert(
            `신분증 인식 완료!\n이름: ${extractedInfo.name}\n주민번호: ${extractedInfo.id_number}\n\n등록되지 않은 고객입니다. 신규 고객 등록이 필요합니다.`
          );
        } else {
          alert("등록되지 않은 고객입니다. 신규 고객 등록이 필요합니다.");
        }
      }
    } catch (error) {
      console.error("OCR 처리 오류:", error);
      alert("신분증 인식에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
      setCameraActive(false);
    }
  };
  // 추천 전송 헬퍼 함수
  const sendRecommendation = useCallback(
    async (message) => {
      // STOMP 연결되어 있으면 바로 전송
      if (stompClient && stompClient.connected) {
        try {
          stompClient.publish({
            destination: "/app/request-recommendation",
            body: JSON.stringify(message),
          });
          console.log("🎯 [DEBUG] STOMP 전송 완료");
        } catch (e) {
          console.warn("⚠️ STOMP 전송 실패, REST로 폴백:", e);
        }
      } else {
        console.warn("⚠️ STOMP 미연결, REST로 폴백");
      }

      // REST 폴백 (또는 보조 경로로 항상 호출)
      try {
        const res = await fetch("/api/recommendations/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: message.customerId,
            voiceText: message.transcript,
          }),
        });
        if (!res.ok) throw new Error("REST 요청 실패");
        console.log("🎯 [DEBUG] REST 폴백 전송 완료");
        // 응답 본문으로 즉시 UI 업데이트 (STOMP 미연결 시에도 표시)
        try {
          const result = await res.json();
          if (result && Array.isArray(result.recommendations)) {
            setAiRecommendations(result.recommendations);
            setRecommendationIntent(
              result.intentAnalysis?.intent || "일반상담"
            );
            setShowAiRecommendations(true);
            console.log("🎯 [DEBUG] REST 응답으로 즉시 추천 UI 업데이트 완료");

            // 태블릿으로도 추천 결과 전달 (REST 폴백 경로)
            if (stompClient && stompClient.connected && sessionId) {
              try {
                stompClient.publish({
                  destination: "/app/send-message",
                  body: JSON.stringify({
                    sessionId: sessionId,
                    type: "tab-change",
                    data: { activeTab: "customer" },
                    timestamp: Date.now(),
                  }),
                });
                const topProduct = (result.recommendations || [])[0] || null;
                if (topProduct) {
                  stompClient.publish({
                    destination: "/app/send-message",
                    body: JSON.stringify({
                      sessionId: sessionId,
                      type: "product-recommendation",
                      data: { product: topProduct },
                      timestamp: Date.now(),
                    }),
                  });
                  console.log(
                    "📱 태블릿으로 대표 추천 전송 완료 (REST 폴백 경로)"
                  );
                }
              } catch (e) {
                console.warn("태블릿 추천 결과 전송 실패:", e);
              }
            }
          }
        } catch (parseErr) {
          console.warn("REST 응답 파싱 중 오류:", parseErr);
        }
        return true;
      } catch (err) {
        console.error("❌ 추천 요청 전송 실패(STOMP/REST 모두 실패):", err);
        return false;
      }
    },
    [stompClient]
  );

  // 음성 명령 감지 함수
  const detectVoiceCommands = useCallback(
    (transcript) => {
      console.log("🎤 [DEBUG] detectVoiceCommands 호출됨:", transcript);
      const text = transcript.toLowerCase();
      console.log("🎤 [DEBUG] 소문자 변환된 텍스트:", text);

      // 계산기 관련 키워드 감지
      const calculatorKeywords = [
        "계산기",
        "금리 계산",
        "이자 계산",
        "단리",
        "복리",
        "금리",
        "이자",
        "계산",
        "얼마",
        "돈",
        "수익",
      ];

      const hasCalculatorKeyword = calculatorKeywords.some((keyword) =>
        text.includes(keyword)
      );

      console.log("🧮 [DEBUG] 계산기 키워드 체크:", hasCalculatorKeyword);

      if (hasCalculatorKeyword) {
        console.log("🧮 계산기 키워드 감지:", transcript);
        setShowCalculator(true);
        showToast("금리 계산기가 열렸습니다.", "info");

        // 태블릿에 계산기 열기 메시지 전송
        if (stompClient && stompClient.connected) {
          try {
            stompClient.publish({
              destination: `/app/send-message`,
              body: JSON.stringify({
                sessionId: sessionId,
                type: "calculator-open",
                data: {
                  transcript: transcript,
                  timestamp: Date.now(),
                },
              }),
            });
            console.log("📱 태블릿에 계산기 열기 메시지 전송:", transcript);
          } catch (error) {
            console.error("❌ 계산기 열기 메시지 전송 실패:", error);
          }
        }

        // 숫자 추출 시도
        const numbers = transcript.match(/\d+/g);
        if (numbers) {
          // 첫 번째 숫자를 원금으로 설정
          const principal = numbers[0];
          if (principal) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("calculatorVoiceCommand", {
                  detail: { command: "set_principal", value: principal },
                })
              );
            }, 500);
          }

          // 두 번째 숫자를 금리로 설정
          if (numbers[1]) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("calculatorVoiceCommand", {
                  detail: { command: "set_rate", value: numbers[1] },
                })
              );
            }, 700);
          }

          // 세 번째 숫자를 기간으로 설정
          if (numbers[2]) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("calculatorVoiceCommand", {
                  detail: { command: "set_period", value: numbers[2] },
                })
              );
            }, 900);
          }
        }

        // 단리/복리 키워드 감지
        if (text.includes("단리")) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("calculatorVoiceCommand", {
                detail: { command: "set_type", value: "simple" },
              })
            );
          }, 1000);
        } else if (text.includes("복리")) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("calculatorVoiceCommand", {
                detail: { command: "set_type", value: "compound" },
              })
            );
          }, 1000);
        }

        // 계산 명령 감지
        if (text.includes("계산") || text.includes("얼마")) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("calculatorVoiceCommand", {
                detail: { command: "calculate", value: null },
              })
            );
          }, 1200);
        }
      }

      // ===== 상품 추천 명령 감지 (계산기와 독립) =====
      const normalizedText = text
        .normalize("NFC")
        .replace(/[\p{P}\p{S}]/gu, " ") // 문장부호 제거
        .replace(/\s+/g, " ") // 다중 공백 축약
        .trim();
      const compactText = normalizedText.replace(/\s+/g, ""); // 공백 제거 버전

      const recommendationKeywords = [
        "펀드 추천",
        "상품 추천",
        "예금 추천",
        "적금 추천",
        "투자 추천",
        "펀드",
        "추천",
      ];

      const matchedKeywords = recommendationKeywords.filter((keyword) => {
        const kCompact = keyword.replace(/\s+/g, "");
        return (
          normalizedText.includes(keyword) || compactText.includes(kCompact)
        );
      });

      console.log("🎯 [DEBUG] 추천 텍스트:", {
        text,
        normalizedText,
        compactText,
      });
      console.log("🎯 [DEBUG] 매칭 키워드:", matchedKeywords);

      if (matchedKeywords.length > 0) {
        console.log("🎯 상품 추천 명령 감지:", transcript);

        if (sessionId && currentCustomer) {
          setTimeout(() => {
            const message = {
              sessionId: sessionId,
              customerId:
                currentCustomer.CustomerID || currentCustomer.customerId,
              intent: "product_recommendation",
              transcript: transcript,
              timestamp: new Date().toISOString(),
            };

            console.log("🎯 [DEBUG] 추천 전송 시도:", message);
            sendRecommendation(message);
          }, 600);

          // 토스트 알림
          if (window.showToast) {
            window.showToast("🎯 상품 추천을 요청했습니다", "info");
          }
        } else {
          console.warn(
            "⚠️ [DEBUG] 추천 요청 조건 미충족. WebSocket 메시지 전송 불가."
          );
          if (!stompClient) console.warn("  - stompClient is null/undefined");
          if (!stompClient?.connected)
            console.warn("  - stompClient is not connected");
          if (!sessionId) console.warn("  - sessionId is null/empty");
          if (!currentCustomer)
            console.warn("  - currentCustomer is null/undefined");
        }
        return; // 추천 명령이 감지되면 다른 명령은 처리하지 않음
      }
    },
    [stompClient, sessionId, currentCustomer, sendRecommendation]
  );

  // STT 핸들러 함수들
  const handleSTTTranscript = useCallback(
    async (transcript, speakerId = "speaker_employee", confidence = 0.8) => {
      console.log(
        "🎤 STT 결과:",
        transcript,
        "화자:",
        speakerId,
        "신뢰도:",
        confidence
      );
      setSttTranscript((prev) => prev + transcript + " ");

      // 실시간 채팅에 메시지 추가
      const newMessage = {
        id: Date.now(),
        speakerId: speakerId,
        text: transcript,
        timestamp: new Date(),
        confidence: confidence,
        isInterim: false,
      };
      setChatMessages((prev) => [...prev, newMessage]);

      console.log("🎤 [DEBUG] detectVoiceCommands 호출 전:", transcript);
      detectVoiceCommands(transcript);
      console.log("🎤 [DEBUG] detectVoiceCommands 호출 후");

      if (consultationId) {
        const speakerName = speakerId === "speaker_employee" ? "직원" : "고객";
        await saveMessageToConsultation({
          speakerId: speakerId,
          speakerName: speakerName,
          transcript: transcript,
          confidence: 0.8, // 기본 신뢰도
        });
      }

      // STT 결과를 태블릿에 전송
      if (stompClient && stompClient.connected && sessionId) {
        stompClient.publish({
          destination: "/app/send-message",
          body: JSON.stringify({
            sessionId: sessionId,
            type: "STT_TRANSCRIPT",
            transcript: transcript,
            speaker: speakerId,
            timestamp: new Date().toISOString(),
          }),
        });
      }

      // 토스트 메시지 표시
      showToast(
        `음성 인식 (${
          speakerId === "SPEAKER_00" ? "행원" : "고객"
        }): ${transcript}`,
        "info"
      );
    },
    [
      stompClient,
      sessionId,
      consultationId,
      saveMessageToConsultation,
      detectVoiceCommands,
    ]
  );

  const handleSTTError = useCallback((error) => {
    console.error("❌ STT 오류:", error);
    showToast(`음성 인식 오류: ${error.message}`, "error");
  }, []);

  const toggleSTT = async () => {
    if (!sttEnabled) {
      // STT 활성화 시도
      const hasVoiceProfile = await checkEmployeeVoiceProfile();

      if (!hasVoiceProfile) {
        // 음성 프로필이 없으면 모달 표시하지 않고 바로 STT 시작
        showToast("음성 프로필이 없습니다. 음성 인식을 시작합니다.", "warning");
      } else {
        showToast("음성 인식이 활성화되었습니다", "success");
      }

      // STT가 활성화될 때 모달들은 표시하지 않음 (백그라운드에서 동작)
    } else {
      showToast("음성 인식이 비활성화되었습니다", "info");
    }

    setSttEnabled((prev) => !prev);
  };
  const syncScreenToCustomer = (screenData) => {
    console.log("🔍 syncScreenToCustomer 호출:", screenData);
    console.log("🔍 stompClient 상태:", stompClient ? "존재" : "없음");
    console.log("🔍 sessionId:", sessionId);
    console.log("🔍 stompClient.active:", stompClient?.active);

    if (stompClient && sessionId && stompClient.connected) {
      // 탭 변경 처리
      if (screenData.type === "tab-change") {
        console.log("🔍 tab-change 메시지 처리:", screenData.data);
        const newTab = screenData.data.activeTab;
        setActiveTab(newTab);

        // 선택된 상품이 있으면 설정
        if (screenData.data.selectedProduct) {
          setSelectedProduct(screenData.data.selectedProduct);
        }

        // enrollmentData가 있으면 설정
        if (screenData.data.enrollmentData) {
          console.log(
            "🔍 enrollmentData 설정:",
            screenData.data.enrollmentData
          );
          setEnrollmentData(screenData.data.enrollmentData);
          setCurrentFormIndex(0);
        }

        // 태블릿으로 탭 변경 메시지 전송
        const tabChangeMessage = {
          type: "tab-change",
          data: {
            activeTab: newTab,
            selectedProduct: screenData.data.selectedProduct,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify(tabChangeMessage),
        });

        console.log("✅ 탭 변경 완료:", newTab);
      } else if (screenData.type === "product-detail-sync") {
        console.log("🔍 product-detail-sync 메시지 전송");
        stompClient.publish({
          destination: "/app/product-detail-sync",
          body: JSON.stringify({
            sessionId: sessionId,
            productData: screenData.data,
          }),
        });
      } else if (screenData.type === "product-enrollment") {
        // 상품 가입 시작
        console.log("🔍 product-enrollment 메시지 전송");
        console.log("🔍 전송할 데이터:", {
          sessionId: sessionId,
          productId: screenData.data.productId,
          customerId: screenData.data.customerId,
        });
        stompClient.publish({
          destination: "/app/product-enrollment",
          body: JSON.stringify({
            sessionId: sessionId,
            productId: screenData.data.productId,
            customerId: screenData.data.customerId,
            forms: screenData.data.forms, // forms 정보 포함
          }),
        });
      } else if (screenData.type === "field-focus") {
        // 필드 포커스 메시지 처리
        console.log("🔍 field-focus 메시지 전송:", screenData);
        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify({
            type: "field-focus",
            data: screenData.data,
            timestamp: new Date().toISOString(),
          }),
        });
      } else {
        stompClient.publish({
          destination: "/app/screen-sync",
          body: JSON.stringify({
            sessionId,
            screenData,
          }),
        });
      }
    }
  };

  if (!employee) {
    return <div>로딩 중...</div>;
  }

  // 고객 정보 로딩 중일 때는 로딩 화면 표시
  if (isLoadingCustomer) {
    return (
      <DashboardContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            color: "#008485",
          }}
        >
          고객 정보를 불러오는 중...
        </div>
      </DashboardContainer>
    );
  }
  return (
    <>
      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes cardFloat {
          0%, 100% {
            transform: perspective(1000px) rotateX(15deg) rotateY(-15deg) translateY(0px);
          }
          50% {
            transform: perspective(1000px) rotateX(15deg) rotateY(-15deg) translateY(-15px);
          }
        }
        
        @keyframes scanLine {
          0% {
            transform: translateY(0px);
            opacity: 0;
          }
          50% {
            transform: translateY(150px);
            opacity: 1;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }
        
        @keyframes particle1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: translate(15px, -20px) scale(1.3);
            opacity: 1;
          }
          50% {
            transform: translate(-8px, -30px) scale(0.7);
            opacity: 0.5;
          }
          75% {
            transform: translate(-20px, -15px) scale(1.2);
            opacity: 0.8;
          }
        }
        
        @keyframes particle2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          33% {
            transform: translate(-15px, 20px) scale(1.4);
            opacity: 1;
          }
          66% {
            transform: translate(20px, 8px) scale(0.6);
            opacity: 0.4;
          }
        }
        
        @keyframes particle3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          40% {
            transform: translate(12px, -25px) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translate(-15px, -12px) scale(0.8);
            opacity: 0.6;
          }
        }
      `}</style>

      <DashboardContainer>
        <MainContent sidebarOpen={sidebarOpen}>
          {/* 탑바 */}
          <div
            style={{
              background: "#008485",
              color: "white",
              padding: "var(--hana-space-4) var(--hana-space-6)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 10px rgba(0, 132, 133, 0.15)",
              position: "relative",
              zIndex: 10,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--hana-space-4)",
              }}
            >
              {/* PyannoteSTT 토글 버튼 */}
              <button
                onClick={() => setShowRealtimeChat(!showRealtimeChat)}
                style={{
                  background: showRealtimeChat
                    ? "rgba(76, 175, 80, 0.8)"
                    : "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  padding: "var(--hana-space-2)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = showRealtimeChat
                    ? "rgba(76, 175, 80, 0.9)"
                    : "rgba(255, 255, 255, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = showRealtimeChat
                    ? "rgba(76, 175, 80, 0.8)"
                    : "rgba(255, 255, 255, 0.2)";
                }}
                title={showRealtimeChat ? "음성 인식 닫기" : "음성 인식 열기"}
              >
                🎤
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--hana-space-3)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  🏦
                </div>
                <div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: "700",
                      lineHeight: 1.3,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    뱅크 어드바이저
                  </h1>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "14px",
                      opacity: 0.9,
                      fontWeight: "400",
                      lineHeight: 1.4,
                      letterSpacing: "0px",
                    }}
                  >
                    지능형 금융 컨설팅 시뮬레이션
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* 탭 메뉴 - 고객이 인증된 경우에만 표시 */}
              {currentCustomer && (
                <div
                  style={{
                    display: "flex",
                    gap: "var(--hana-space-6)",
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <button
                    onClick={() => handleTabChange("dashboard")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      cursor: "pointer",
                      fontSize: "clamp(14px, 2vw, 20px)",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: activeTab === "dashboard" ? "1" : "0.8",
                      borderBottom:
                        activeTab === "dashboard"
                          ? "2px solid white"
                          : "2px solid transparent",
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      minWidth: "fit-content",
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== "dashboard") {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== "dashboard") {
                        e.target.style.opacity = "0.8";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    메인 대시보드
                  </button>

                  <button
                    onClick={() => handleTabChange("simulation")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      cursor: "pointer",
                      fontSize: "clamp(14px, 2vw, 20px)",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: activeTab === "simulation" ? 1 : 0.8,
                      borderBottom:
                        activeTab === "simulation"
                          ? "2px solid white"
                          : "2px solid transparent",
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      minWidth: "fit-content",
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== "simulation") {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== "simulation") {
                        e.target.style.opacity = "0.8";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    혜택 시뮬레이션
                  </button>

                  <button
                    onClick={() => handleTabChange("products")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      cursor: "pointer",
                      fontSize: "clamp(14px, 2vw, 20px)",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: activeTab === "products" ? "1" : "0.8",
                      borderBottom:
                        activeTab === "products"
                          ? "2px solid white"
                          : "2px solid transparent",
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      minWidth: "fit-content",
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== "products") {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== "products") {
                        e.target.style.opacity = "0.8";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    상품 탐색
                  </button>

                  <button
                    onClick={() => handleTabChange("history")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      cursor: "pointer",
                      fontSize: "clamp(14px, 2vw, 20px)",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: activeTab === "history" ? "1" : "0.8",
                      borderBottom:
                        activeTab === "history"
                          ? "2px solid white"
                          : "2px solid transparent",
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      minWidth: "fit-content",
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== "history") {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== "history") {
                        e.target.style.opacity = "0.8";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    고객 이력
                  </button>

                  <button
                    onClick={() => handleTabChange("banking")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      cursor: "pointer",
                      fontSize: "clamp(14px, 2vw, 20px)",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: activeTab === "banking" ? "1" : "0.8",
                      borderBottom:
                        activeTab === "banking"
                          ? "2px solid white"
                          : "2px solid transparent",
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      minWidth: "fit-content",
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== "banking") {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== "banking") {
                        e.target.style.opacity = "0.8";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    기본 업무
                  </button>

                  {/* 성능 대시보드 버튼 제거됨 */}
                </div>
              )}

              {/* OCR 인증 버튼 - 고객이 인증되지 않은 경우에만 표시 */}
              {!currentCustomer && (
                <div style={{ display: "flex", gap: "var(--hana-space-2)" }}>
                  <button
                    onClick={() => setCameraActive(true)}
                    disabled={loading}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      borderRadius: "8px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s ease",
                      opacity: loading ? 0.6 : 1,
                    }}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.target.style.background = "rgba(255, 255, 255, 0.3)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!loading) {
                        e.target.style.background = "rgba(255, 255, 255, 0.2)";
                      }
                    }}
                  >
                    {loading ? "⏳" : "📷"} OCR 인증
                  </button>

                  <button
                    onClick={() => setShowCustomerSelect(true)}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "none",
                      color: "white",
                      padding: "var(--hana-space-2) var(--hana-space-3)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "rgba(255, 255, 255, 0.2)";
                    }}
                  >
                    👤 테스트 고객
                  </button>
                </div>
              )}

              {/* 녹음 상태 표시 및 고객 상담 종료 버튼 */}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {/* 녹음 시간 표시 */}
                {isRecording && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: "linear-gradient(135deg, #ff6b6b, #ff8e8e)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "600",
                      boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "white",
                        borderRadius: "50%",
                        animation: "blink 1s infinite",
                      }}
                    ></div>
                    <span>🔴 녹음 중</span>
                    <span style={{ fontFamily: "monospace", fontSize: "16px" }}>
                      {getRecordingDuration()}
                    </span>
                  </div>
                )}

                <button
                  onClick={async () => {
                    // 1. PyannoteSTT 세션 정리 및 요약 저장 강제 실행
                    console.log(
                      "🧾 고객 상담 종료 버튼 클릭 - STT 상태 확인:",
                      {
                        pyannoteSTTRefExists: !!pyannoteSTTRef.current,
                        sttEnabled,
                        showRealtimeChat,
                        hasFinalizeSession: pyannoteSTTRef.current
                          ?.finalizeSession
                          ? true
                          : false,
                      }
                    );

                    if (
                      pyannoteSTTRef.current &&
                      pyannoteSTTRef.current.finalizeSession
                    ) {
                      console.log("🧾 PyannoteSTT finalizeSession 호출");
                      try {
                        await pyannoteSTTRef.current.finalizeSession();
                        console.log("✅ PyannoteSTT finalizeSession 완료");
                      } catch (error) {
                        console.error(
                          "❌ PyannoteSTT finalizeSession 오류:",
                          error
                        );
                      }
                    } else {
                      console.log(
                        "⚠️ PyannoteSTT finalizeSession 호출 불가 - ref 또는 함수 없음"
                      );
                    }

                    // 2. 기존 녹음 중지 및 STT 텍스트 저장
                    if (isRecording) {
                      setIsRecording(false);
                      setRecordingStartTime(null);
                      setSttEnabled(false);

                      // STT 텍스트가 있으면 상담 내역 저장
                      if (sttTranscript) {
                        await saveConsultationTranscript();
                      }
                    }

                    // 2. 고객 상담 종료 시 모든 관련 상태 초기화
                    setCurrentCustomer(null);
                    handleTabChange("dashboard");
                    setSelectedProduct(null);
                    setSelectedProductDetail(null);
                    setShowProductModal(false);
                    setCustomerProducts([]);
                    setLoadingCustomerProducts(false);
                    setEnrollmentData(null);
                    setCurrentFormIndex(0);
                    setFieldValues({});
                    setHighlights([]);
                    setFormCompletion(null);
                    setSttTranscript("");
                    setPrivacyConsentGiven(false);
                    setShowPrivacyConsent(false);
                    setConsultationId(null); // 상담 세션 ID 초기화

                    // localStorage 정리
                    localStorage.removeItem("currentCustomer");
                    localStorage.removeItem("selectedProduct");
                    localStorage.removeItem("enrollmentData");

                    // WebSocket으로 태블릿에 상담 종료 알림
                    if (stompClient && stompClient.active) {
                      stompClient.publish({
                        destination: "/app/send-to-session",
                        body: JSON.stringify({
                          sessionId: sessionId,
                          type: "consultation-ended",
                          data: {
                            message: "상담이 종료되었습니다.",
                            timestamp: new Date().toISOString(),
                          },
                        }),
                      });
                    }

                    console.log(
                      "고객 상담 종료 - 녹음 중지 및 모든 상태 초기화 완료"
                    );
                  }}
                  style={{
                    background: "rgba(255, 107, 107, 0.8)",
                    border: "none",
                    color: "white",
                    padding: "var(--hana-space-2) var(--hana-space-3)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "rgba(255, 107, 107, 1)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "rgba(255, 107, 107, 0.8)";
                  }}
                >
                  🏁 고객 상담 종료
                </button>
              </div>
            </div>
          </div>
          <TabContent>
            {activeTab === "dashboard" && (
              <div>
                {currentCustomer ? (
                  <div>
                    <CustomerInfoDisplay
                      customer={currentCustomer}
                      onSelectProduct={async (product) => {
                        // 가입 이력인 경우 서식 조회
                        if (product.isEnrollmentHistory) {
                          console.log(
                            "📋 가입 이력 클릭 - 서식 조회:",
                            product
                          );
                          await fetchProductForm(
                            product.productId,
                            currentCustomer.CustomerID
                          );
                          return;
                        }

                        // 일반 상품인 경우 기존 로직
                        setSelectedProductDetail(product);
                        setShowProductModal(true);
                      }}
                      customerProducts={customerProducts}
                      loadingProducts={loadingCustomerProducts}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "60vh",
                      padding: "var(--hana-space-8)",
                      background:
                        "linear-gradient(135deg, var(--hana-primary-light), var(--hana-mint-light))",
                      borderRadius: "var(--hana-radius-xl)",
                      margin: "var(--hana-space-4)",
                      border: "3px solid var(--hana-primary)",
                      textAlign: "center",
                    }}
                  >
                    {/* 아이소메트릭 신분증 애니메이션 */}
                    <div
                      style={{
                        width: "300px",
                        height: "300px",
                        marginBottom: "var(--hana-space-10)",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* 신분증 카드 */}
                      <div
                        style={{
                          width: "200px",
                          height: "130px",
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                          borderRadius: "16px",
                          border: "4px solid var(--hana-primary)",
                          boxShadow: "0 20px 60px rgba(0, 166, 147, 0.4)",
                          transform:
                            "perspective(1000px) rotateX(15deg) rotateY(-15deg)",
                          animation: "cardFloat 3s ease-in-out infinite",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* 신분증 내부 디테일 */}
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            right: "12px",
                            height: "28px",
                            background:
                              "linear-gradient(90deg, var(--hana-primary) 0%, var(--hana-mint) 100%)",
                            borderRadius: "6px",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "50px",
                            left: "12px",
                            width: "40px",
                            height: "40px",
                            background: "var(--hana-primary)",
                            borderRadius: "50%",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "55px",
                            left: "60px",
                            right: "12px",
                            height: "12px",
                            background: "var(--hana-gray-light)",
                            borderRadius: "6px",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "72px",
                            left: "60px",
                            right: "12px",
                            height: "8px",
                            background: "var(--hana-gray-light)",
                            borderRadius: "4px",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            left: "12px",
                            right: "12px",
                            height: "16px",
                            background:
                              "linear-gradient(90deg, var(--hana-mint) 0%, var(--hana-primary) 100%)",
                            borderRadius: "8px",
                          }}
                        />
                      </div>
                      {/* 스캔 라인 애니메이션 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "0",
                          left: "0",
                          right: "0",
                          height: "4px",
                          background:
                            "linear-gradient(90deg, transparent 0%, var(--hana-primary) 50%, transparent 100%)",
                          animation: "scanLine 2s ease-in-out infinite",
                        }}
                      />
                      {/* 주변 파티클 효과 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "30px",
                          left: "30px",
                          width: "12px",
                          height: "12px",
                          background: "var(--hana-primary)",
                          borderRadius: "50%",
                          animation: "particle1 3s ease-in-out infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "90px",
                          right: "45px",
                          width: "10px",
                          height: "10px",
                          background: "var(--hana-mint)",
                          borderRadius: "50%",
                          animation: "particle2 2.5s ease-in-out infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "60px",
                          left: "60px",
                          width: "8px",
                          height: "8px",
                          background: "var(--hana-primary)",
                          borderRadius: "50%",
                          animation: "particle3 3.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                    <h3
                      style={{
                        color: "var(--hana-primary)",
                        marginBottom: "var(--hana-space-6)",
                        fontSize: "3.5rem",
                        fontWeight: "700",
                      }}
                    >
                      고객 신분증 인식
                    </h3>
                    <p
                      style={{
                        color: "var(--hana-gray)",
                        fontSize: "1.8rem",
                        marginBottom: "var(--hana-space-10)",
                        lineHeight: 1.6,
                        maxWidth: "800px",
                      }}
                    >
                      AI 기반 신분증 인식으로
                      <br />
                      빠르고 정확한 고객 정보 확인
                    </p>
                    <button
                      onClick={() => {
                        setShowCustomerLoginModal(true);
                        // 태블릿에 고객 로그인 시작 메시지 전송
                        if (stompClient && sessionId) {
                          stompClient.publish({
                            destination: "/app/send-message",
                            body: JSON.stringify({
                              sessionId: sessionId,
                              type: "customer-login-start",
                              data: { message: "고객 로그인을 시작합니다" },
                            }),
                          });
                        }
                      }}
                      style={{
                        padding: "var(--hana-space-8) var(--hana-space-16)",
                        background:
                          "linear-gradient(135deg, var(--hana-primary), var(--hana-mint))",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--hana-radius-xl)",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "1.8rem",
                        boxShadow: "var(--hana-shadow-heavy)",
                        transition: "all var(--hana-transition-base)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-4)",
                        minWidth: "400px",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-3px)";
                        e.target.style.boxShadow =
                          "0 8px 25px rgba(0, 133, 122, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "var(--hana-shadow-heavy)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        📷
                      </div>
                      신분증 인식 시작하기
                    </button>{" "}
                  </div>
                )}
              </div>
            )}

            {activeTab === "customer" &&
              (currentCustomer ? (
                <div>
                  <CustomerInfoDisplay
                    customer={currentCustomer}
                    detailed
                    onSendToTablet={sendCustomerInfoToTablet}
                    customerProducts={customerProducts}
                    loadingProducts={loadingCustomerProducts}
                    onSelectProduct={async (product) => {
                      // 가입 이력인 경우 서식 조회
                      if (product.isEnrollmentHistory) {
                        console.log("📋 가입 이력 클릭 - 서식 조회:", product);
                        await fetchProductForm(
                          product.productId,
                          currentCustomer.CustomerID
                        );
                        return;
                      }

                      // 일반 상품인 경우 기존 로직
                      setSelectedProductDetail(product);
                      setShowProductModal(true);

                      // 태블릿으로 상품 정보 전송
                      if (stompClient && sessionId && stompClient.connected) {
                        console.log("📤 태블릿에 상품 정보 전송:", product);
                        stompClient.publish({
                          destination: "/app/send-to-session",
                          body: JSON.stringify({
                            sessionId: sessionId,
                            type: "product-selected",
                            data: {
                              product: product,
                              timestamp: new Date().toISOString(),
                            },
                          }),
                        });
                      }
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    padding: "var(--hana-space-8)",
                    background:
                      "linear-gradient(135deg, var(--hana-primary-light), var(--hana-mint-light))",
                    borderRadius: "var(--hana-radius-xl)",
                    margin: "var(--hana-space-4)",
                    border: "3px solid var(--hana-primary)",
                    textAlign: "center",
                  }}
                >
                  {/* 아이소메트릭 신분증 애니메이션 */}
                  <div
                    style={{
                      width: "300px",
                      height: "300px",
                      marginBottom: "var(--hana-space-10)",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* 신분증 카드 */}
                    <div
                      style={{
                        width: "200px",
                        height: "130px",
                        background:
                          "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                        borderRadius: "16px",
                        border: "4px solid var(--hana-primary)",
                        boxShadow: "0 20px 60px rgba(0, 166, 147, 0.4)",
                        transform:
                          "perspective(1000px) rotateX(15deg) rotateY(-15deg)",
                        animation: "cardFloat 3s ease-in-out infinite",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* 신분증 내부 디테일 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          right: "12px",
                          height: "28px",
                          background:
                            "linear-gradient(90deg, var(--hana-primary) 0%, var(--hana-mint) 100%)",
                          borderRadius: "6px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50px",
                          left: "12px",
                          width: "40px",
                          height: "40px",
                          background: "var(--hana-primary)",
                          borderRadius: "50%",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "55px",
                          left: "60px",
                          right: "12px",
                          height: "12px",
                          background: "var(--hana-gray-light)",
                          borderRadius: "6px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "72px",
                          left: "60px",
                          right: "12px",
                          height: "8px",
                          background: "var(--hana-gray-light)",
                          borderRadius: "4px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          left: "12px",
                          right: "12px",
                          height: "16px",
                          background:
                            "linear-gradient(90deg, var(--hana-mint) 0%, var(--hana-primary) 100%)",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                    {/* 스캔 라인 애니메이션 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        right: "0",
                        height: "4px",
                        background:
                          "linear-gradient(90deg, transparent 0%, var(--hana-primary) 50%, transparent 100%)",
                        animation: "scanLine 2s ease-in-out infinite",
                      }}
                    />
                    {/* 주변 파티클 효과 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "30px",
                        left: "30px",
                        width: "12px",
                        height: "12px",
                        background: "var(--hana-primary)",
                        borderRadius: "50%",
                        animation: "particle1 3s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "90px",
                        right: "45px",
                        width: "10px",
                        height: "10px",
                        background: "var(--hana-mint)",
                        borderRadius: "50%",
                        animation: "particle2 2.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "60px",
                        left: "60px",
                        width: "8px",
                        height: "8px",
                        background: "var(--hana-primary)",
                        borderRadius: "50%",
                        animation: "particle3 3.5s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "var(--hana-space-6)",
                      fontSize: "3.5rem",
                      fontWeight: "700",
                    }}
                  >
                    고객 신분증 인식
                  </h3>

                  <p
                    style={{
                      color: "var(--hana-gray)",
                      fontSize: "1.8rem",
                      marginBottom: "var(--hana-space-10)",
                      lineHeight: 1.6,
                      maxWidth: "800px",
                    }}
                  >
                    AI 기반 신분증 인식으로
                    <br />
                    빠르고 정확한 고객 정보 확인
                  </p>

                  <button
                    onClick={() => {
                      setShowCustomerLoginModal(true);
                      // 태블릿에 고객 로그인 시작 메시지 전송
                      if (stompClient && sessionId) {
                        stompClient.publish({
                          destination: "/app/send-message",
                          body: JSON.stringify({
                            sessionId: sessionId,
                            type: "customer-login-start",
                            data: { message: "고객 로그인을 시작합니다" },
                          }),
                        });
                      }
                    }}
                    style={{
                      padding: "var(--hana-space-8) var(--hana-space-16)",
                      background:
                        "linear-gradient(135deg, var(--hana-primary), var(--hana-mint))",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--hana-radius-xl)",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "1.8rem",
                      boxShadow: "var(--hana-shadow-heavy)",
                      transition: "all var(--hana-transition-base)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--hana-space-4)",
                      minWidth: "400px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow =
                        "0 8px 25px rgba(0, 133, 122, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "var(--hana-shadow-heavy)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      📷
                    </div>
                    신분증 인식 시작하기
                  </button>
                </div>
              ))}
            {activeTab === "products" && (
              <ProductExplorer
                onScreenSync={syncScreenToCustomer}
                onProductSelected={async (product) => {
                  console.log("상품 선택됨:", product);
                  setSelectedProduct(product);
                  setActiveTab("forms"); // 상품 선택 시 자동으로 forms 탭으로 변경

                  // 폼 로드 보강: 제품 선택 시에도 백엔드에서 폼을 직접 조회하여 주입
                  let forms = [];
                  try {
                    const productId =
                      product?.productId ||
                      product?.product_id ||
                      product?.id ||
                      "";
                    if (productId) {
                      const resp = await fetch(
                        `/forms/byProductId/${productId}`
                      );
                      if (resp.ok) {
                        const json = await resp.json();
                        const apiForms = json?.data; // forms가 아닌 data 자체가 배열
                        if (
                          apiForms &&
                          Array.isArray(apiForms) &&
                          apiForms.length > 0
                        ) {
                          console.log(
                            "🔍 [EmployeeDashboard] onProductSelected 폼 로드 성공:",
                            apiForms.length
                          );
                          forms = filterEnrollmentForms(apiForms);
                          setApiForms(forms);
                        } else {
                          console.warn(
                            "⚠️ [EmployeeDashboard] onProductSelected 폼 없음 또는 형식 불일치"
                          );
                        }
                      } else {
                        console.warn(
                          "⚠️ [EmployeeDashboard] onProductSelected 폼 API 실패:",
                          resp.status
                        );
                      }
                    }
                  } catch (err) {
                    console.error(
                      "❌ [EmployeeDashboard] onProductSelected 폼 로드 오류:",
                      err
                    );
                  }

                  // 기본 서식이 없으면 기본 서식 사용
                  if (forms.length === 0) {
                    forms = [
                      {
                        formId: "consent_form",
                        formName: "개인정보 수집 이용 동의서",
                        formType: "consent",
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
                            name: "개인정보 수집 이용 동의",
                            type: "checkbox",
                            required: true,
                          },
                        ],
                      },
                      {
                        formId: "application_form",
                        formName: "은행거래신청서",
                        formType: "application",
                        fields: [
                          {
                            id: "account_type",
                            name: "계좌 유형",
                            type: "select",
                            required: true,
                            options: ["입출금통장", "적금", "대출"],
                          },
                          {
                            id: "initial_deposit",
                            name: "초기 입금액",
                            type: "number",
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
                    ];
                  }

                  // 고객 태블릿에 상품 가입 메시지 전송
                  if (stompClient && sessionId) {
                    const enrollmentMessage = {
                      type: "product-enrollment",
                      action: "start_enrollment",
                      data: {
                        productId:
                          product?.productId ||
                          product?.product_id ||
                          product?.id ||
                          "P001",
                        productName:
                          product?.productName ||
                          product?.product_name ||
                          product?.name ||
                          "기본 상품",
                        productType:
                          product?.productType ||
                          product?.product_type ||
                          product?.type ||
                          "적금",
                        customerId:
                          currentCustomer?.CustomerID ||
                          currentCustomer?.customerId ||
                          "C001",
                        forms: forms,
                      },
                    };

                    stompClient.publish({
                      destination: "/app/send-message",
                      body: JSON.stringify({
                        sessionId: sessionId,
                        ...enrollmentMessage,
                      }),
                    });

                    console.log(
                      "✅ [EmployeeDashboard] 상품 가입 메시지 전송:",
                      enrollmentMessage
                    );
                  }

                  // 상품 선택 후 서식 탭으로 이동
                  setActiveTab("forms");
                }}
                onApiFormsReceived={(forms) => {
                  console.log(
                    "🔍 [EmployeeDashboard] onApiFormsReceived 호출됨!"
                  );
                  console.log("🔍 [EmployeeDashboard] 받은 forms:", forms);
                  console.log(
                    "🔍 [EmployeeDashboard] forms 타입:",
                    typeof forms
                  );
                  console.log(
                    "🔍 [EmployeeDashboard] forms 길이:",
                    forms?.length
                  );
                  console.log(
                    "🔍 [EmployeeDashboard] 원본 폼 목록:",
                    forms?.map((f) => ({ id: f.formId, name: f.formName }))
                  );

                  if (forms && forms.length > 0) {
                    const filtered = filterEnrollmentForms(forms);
                    console.log(
                      "✅ [EmployeeDashboard] 선별된 서식:",
                      filtered.map((f) => f?.formName)
                    );
                    console.log(
                      "✅ [EmployeeDashboard] 선별된 서식 개수:",
                      filtered.length
                    );
                    setApiForms(filtered);
                    console.log("✅ [EmployeeDashboard] setApiForms 호출 완료");
                  } else {
                    console.warn(
                      "⚠️ [EmployeeDashboard] forms가 비어있음, apiForms를 null로 설정"
                    );
                    setApiForms(null);
                  }
                }}
                customerId={currentCustomer?.CustomerID}
                sessionId={sessionId}
                stompClient={stompClient}
              />
            )}
            {activeTab === "forms" && selectedProduct && (
              <FormManager
                customerData={currentCustomer}
                selectedProduct={selectedProduct}
                isEmployee={true}
                onFormComplete={async (data) => {
                  console.log(
                    "✅ [EmployeeDashboard] 서식 완료 - 저장 시작:",
                    data
                  );

                  try {
                    // 백엔드 API로 서식 데이터 저장
                    const response = await fetch("/api/form-submission/save", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        submissionId: `SUB_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                        customerId:
                          data.customerId ||
                          currentCustomer?.CustomerID ||
                          "C6660",
                        employeeId: "E001",
                        productId:
                          data.productId ||
                          selectedProduct?.productId ||
                          selectedProduct?.product_id ||
                          "PROD_001",
                        productName:
                          data.productName ||
                          selectedProduct?.productName ||
                          selectedProduct?.name ||
                          "하나금융상품",
                        formId: data.formId,
                        formName: data.formTitle,
                        formType: "consent",
                        formData: JSON.stringify(data.formData),
                        screenshotUrl: null, // 스크린샷 URL (나중에 업로드 시 설정)
                        jsonFileUrl: null, // JSON 파일 URL (나중에 업로드 시 설정)
                        completionRate: 100,
                        status: "COMPLETED",
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      console.error("❌ 서식 저장 실패 상세:", errorData);
                      throw new Error(
                        `서식 저장 실패: ${response.status} - ${
                          errorData.message || "알 수 없는 오류"
                        }`
                      );
                    }

                    const result = await response.json();
                    console.log(
                      "✅ [EmployeeDashboard] 서식 저장 완료:",
                      result
                    );

                    // 태블릿으로 완료 메시지 전송
                    if (stompClient && sessionId && stompClient.connected) {
                      const completionMessage = {
                        type: "enrollment-completed",
                        data: {
                          message: "상품 가입이 완료되었습니다.",
                          submissionId: result.data?.submissionId,
                          productId: data.productId,
                          productName: data.productName,
                          customerName:
                            currentCustomer?.Name ||
                            currentCustomer?.name ||
                            "고객님",
                          timestamp: new Date().toISOString(),
                        },
                        timestamp: new Date().toISOString(),
                      };

                      stompClient.publish({
                        destination: "/topic/session/tablet_main",
                        body: JSON.stringify(completionMessage),
                      });

                      console.log(
                        "📤 [EmployeeDashboard] 태블릿에 가입 완료 메시지 전송:",
                        completionMessage
                      );
                    }

                    showToast(
                      "✅ 서식이 성공적으로 저장되었습니다!",
                      "success"
                    );
                  } catch (error) {
                    console.error(
                      "❌ [EmployeeDashboard] 서식 저장 실패:",
                      error
                    );
                    showToast("❌ 서식 저장에 실패했습니다.", "error");
                  }
                }}
                onScreenSync={syncScreenToCustomer}
                sessionId={sessionId}
                stompClient={stompClient}
                apiForms={apiForms}
                onNavigateToDashboard={() => {
                  // 태블릿 모달 닫기
                  if (stompClient && sessionId) {
                    const closeModalMessage = {
                      type: "close-modal",
                      data: {},
                      timestamp: new Date().toISOString(),
                    };
                    stompClient.publish({
                      destination: "/topic/session/" + sessionId,
                      body: JSON.stringify(closeModalMessage),
                    });
                  }
                  // 대시보드로 이동 (products 탭으로)
                  setActiveTab("products");
                  setSelectedProduct(null);
                  // setApiForms(null); // apiForms는 유지 (다른 작업 후 돌아올 때 폼 데이터 보존)
                }}
              />
            )}
            {activeTab === "pdf-forms" &&
              (enrollmentData ? (
                <div style={{ padding: "2rem" }}>
                  <h2
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "1rem",
                    }}
                  >
                    📝 상품 가입 서식
                  </h2>
                  {console.log("🔍 [EmployeeDashboard] pdf-forms 탭 렌더링:", {
                    activeTab,
                    enrollmentData: !!enrollmentData,
                    formsCount: enrollmentData?.forms?.length,
                    currentFormIndex,
                    currentForm: enrollmentData?.forms?.[currentFormIndex],
                  })}
                  {console.log(
                    "🔍 [EmployeeDashboard] enrollmentData 상세:",
                    JSON.stringify(enrollmentData, null, 2)
                  )}
                  {console.log(
                    "🔍 [EmployeeDashboard] currentForm 상세:",
                    JSON.stringify(
                      enrollmentData?.forms?.[currentFormIndex],
                      null,
                      2
                    )
                  )}
                  <div
                    style={{
                      background: "white",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      boxShadow: "var(--hana-shadow-light)",
                    }}
                  >
                    <div style={{ marginBottom: "1rem" }}>
                      <strong>{enrollmentData.productName}</strong> 가입 서식
                    </div>

                    {enrollmentData.forms &&
                      enrollmentData.forms.length > 0 && (
                        <>
                          <div
                            style={{
                              background: "#e8f5e8",
                              border: "1px solid #4caf50",
                              borderRadius: "8px",
                              padding: "1rem",
                              marginBottom: "1rem",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#2e7d32",
                                marginBottom: "0.5rem",
                              }}
                            >
                              서식 {currentFormIndex + 1} /{" "}
                              {enrollmentData.forms.length}
                            </div>
                            <div style={{ color: "#2e7d32" }}>
                              {enrollmentData.forms[currentFormIndex]?.formName}
                            </div>

                            {/* 서식 완성도 표시 */}
                            {formCompletion && (
                              <div
                                style={{
                                  background: "rgba(0, 0, 0, 0.8)",
                                  color: "white",
                                  padding: "0.5rem 1rem",
                                  borderRadius: "8px",
                                  fontSize: "0.9rem",
                                  marginTop: "0.5rem",
                                  minWidth: "200px",
                                }}
                              >
                                <div>
                                  📊 서식 완성도:{" "}
                                  {formCompletion.completionRate}%
                                </div>
                                <div>
                                  ✅ 완료된 필드:{" "}
                                  {formCompletion.completedFields}/
                                  {formCompletion.totalFields}
                                </div>
                                {formCompletion.isComplete && (
                                  <div
                                    style={{
                                      color: "#4CAF50",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    🎉 서식 작성 완료!
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 서식 저장 버튼 */}
                            <div style={{ marginTop: "1rem" }}>
                              <button
                                onClick={handleSaveForm}
                                disabled={isSavingForm}
                                style={{
                                  padding: "0.75rem 1.5rem",
                                  background: isSavingForm ? "#ccc" : "#4CAF50",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: isSavingForm
                                    ? "not-allowed"
                                    : "pointer",
                                  fontSize: "1rem",
                                  fontWeight: "700",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                {isSavingForm
                                  ? "💾 저장 중..."
                                  : "💾 서식 저장"}
                              </button>
                            </div>
                          </div>

                          {/* 서식 필드 표시 */}
                          {enrollmentData.forms[currentFormIndex]
                            ?.isReactForm ? (
                            // React 서식 표시
                            <div
                              style={{
                                background: "#f8f9fa",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "1.5rem",
                                marginBottom: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "1rem",
                                  color: "#008485",
                                }}
                              >
                                📄 React 서식 뷰어
                              </div>

                              {/* React 서식 컴포넌트 */}
                              {console.log(
                                "🔍 [EmployeeDashboard] React 서식 렌더링:",
                                {
                                  formType:
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType,
                                  formName:
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formName,
                                  isReactForm:
                                    enrollmentData.forms[currentFormIndex]
                                      ?.isReactForm,
                                }
                              )}
                              {console.log(
                                "🔍 [EmployeeDashboard] 조건 확인:",
                                {
                                  "formType === 'consent'":
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType === "consent",
                                  "formType === 'application'":
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType === "application",
                                  "formType === 'electronic_finance'":
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType === "electronic_finance",
                                  "formType === 'financial_purpose'":
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType === "financial_purpose",
                                  "실제 formType":
                                    enrollmentData.forms[currentFormIndex]
                                      ?.formType,
                                }
                              )}
                              {enrollmentData.forms[currentFormIndex]
                                ?.formType === "consent" ? (
                                <>
                                  {console.log(
                                    "🔍 [EmployeeDashboard] ConsentForm 렌더링:",
                                    {
                                      fieldValues,
                                      fieldValuesKeys: Object.keys(fieldValues),
                                      fieldValuesCount:
                                        Object.keys(fieldValues).length,
                                    }
                                  )}
                                  <ConsentForm
                                    fieldValues={fieldValues}
                                    onFieldClick={(
                                      fieldId,
                                      fieldLabel,
                                      fieldType
                                    ) => {
                                      console.log(
                                        "🖱️ EmployeeDashboard ConsentForm 필드 클릭:",
                                        { fieldId, fieldLabel, fieldType }
                                      );
                                      // 태블릿에 필드 포커스 메시지 전송 (단순화된 구조)
                                      if (stompClient && sessionId) {
                                        const messageBody = {
                                          type: "field-focus",
                                          sessionId: sessionId,
                                          data: {
                                            fieldId: fieldId,
                                            fieldName: fieldId,
                                            fieldLabel: fieldLabel,
                                            fieldType: fieldType,
                                            fieldPlaceholder: `${fieldLabel}을(를) 입력해주세요`,
                                            formIndex: currentFormIndex,
                                            formName:
                                              "개인정보 수집 이용 동의서",
                                          },
                                          timestamp: new Date().toISOString(),
                                        };

                                        console.log(
                                          "📤 EmployeeDashboard field-focus 메시지 전송 준비:",
                                          messageBody
                                        );
                                        console.log(
                                          "🔍 stompClient 상태:",
                                          !!stompClient
                                        );
                                        console.log("🔍 sessionId:", sessionId);

                                        stompClient.publish({
                                          destination:
                                            "/topic/session/tablet_main",
                                          body: JSON.stringify(messageBody),
                                        });
                                        console.log(
                                          "📤 EmployeeDashboard에서 field-focus 메시지 전송 완료:",
                                          { fieldId, fieldLabel, fieldType }
                                        );
                                      } else {
                                        console.log(
                                          "❌ stompClient 또는 sessionId가 없음:",
                                          {
                                            stompClient: !!stompClient,
                                            sessionId,
                                          }
                                        );
                                      }
                                    }}
                                  />
                                </>
                              ) : enrollmentData.forms[currentFormIndex]
                                  ?.formType === "application" ? (
                                <ApplicationForm
                                  fieldValues={fieldValues}
                                  onFieldClick={(
                                    fieldId,
                                    fieldLabel,
                                    fieldType
                                  ) => {
                                    console.log(
                                      "🖱️ EmployeeDashboard ApplicationForm 필드 클릭:",
                                      { fieldId, fieldLabel, fieldType }
                                    );
                                    // 태블릿에 필드 포커스 메시지 전송 (단순화된 구조)
                                    if (stompClient && sessionId) {
                                      const messageBody = {
                                        type: "field-focus",
                                        sessionId: sessionId,
                                        data: {
                                          fieldId: fieldId,
                                          fieldName: fieldId,
                                          fieldLabel: fieldLabel,
                                          fieldType: fieldType,
                                          fieldPlaceholder: `${fieldLabel}을(를) 입력해주세요`,
                                          formIndex: currentFormIndex,
                                          formName: "은행거래신청서",
                                        },
                                        timestamp: new Date().toISOString(),
                                      };

                                      stompClient.publish({
                                        destination:
                                          "/topic/session/tablet_main",
                                        body: JSON.stringify(messageBody),
                                      });
                                      console.log(
                                        "📤 ApplicationForm에서 field-focus 메시지 전송:",
                                        {
                                          fieldId,
                                          fieldLabel,
                                          fieldType,
                                        }
                                      );
                                    }
                                  }}
                                />
                              ) : enrollmentData.forms[currentFormIndex]
                                  ?.formType === "electronic_finance" ? (
                                <ElectronicFinanceForm
                                  fieldValues={fieldValues}
                                  onFieldClick={(
                                    fieldId,
                                    fieldLabel,
                                    fieldType
                                  ) => {
                                    console.log(
                                      "🖱️ EmployeeDashboard ElectronicFinanceForm 필드 클릭:",
                                      { fieldId, fieldLabel, fieldType }
                                    );
                                    // 태블릿에 필드 포커스 메시지 전송 (단순화된 구조)
                                    if (stompClient && sessionId) {
                                      const messageBody = {
                                        type: "field-focus",
                                        sessionId: sessionId,
                                        data: {
                                          fieldId: fieldId,
                                          fieldName: fieldId,
                                          fieldLabel: fieldLabel,
                                          fieldType: fieldType,
                                          fieldPlaceholder: `${fieldLabel}을(를) 입력해주세요`,
                                          formIndex: currentFormIndex,
                                          formName:
                                            "개인 전자금융서비스 신청서",
                                        },
                                        timestamp: new Date().toISOString(),
                                      };

                                      stompClient.publish({
                                        destination:
                                          "/topic/session/tablet_main",
                                        body: JSON.stringify(messageBody),
                                      });
                                      console.log(
                                        "📤 ElectronicFinanceForm에서 field-focus 메시지 전송:",
                                        {
                                          fieldId,
                                          fieldLabel,
                                          fieldType,
                                        }
                                      );
                                    }
                                  }}
                                />
                              ) : enrollmentData.forms[currentFormIndex]
                                  ?.formType === "financial_purpose" ? (
                                <FinancialPurposeForm
                                  fieldValues={fieldValues}
                                  onFieldClick={(
                                    fieldId,
                                    fieldLabel,
                                    fieldType
                                  ) => {
                                    console.log(
                                      "🖱️ EmployeeDashboard FinancialPurposeForm 필드 클릭:",
                                      { fieldId, fieldLabel, fieldType }
                                    );
                                    // 태블릿에 필드 포커스 메시지 전송 (단순화된 구조)
                                    if (stompClient && sessionId) {
                                      const messageBody = {
                                        type: "field-focus",
                                        sessionId: sessionId,
                                        data: {
                                          fieldId: fieldId,
                                          fieldName: fieldId,
                                          fieldLabel: fieldLabel,
                                          fieldType: fieldType,
                                          fieldPlaceholder: `${fieldLabel}을(를) 입력해주세요`,
                                          formIndex: currentFormIndex,
                                          formName: "금융거래목적확인서",
                                        },
                                        timestamp: new Date().toISOString(),
                                      };

                                      stompClient.publish({
                                        destination:
                                          "/topic/session/tablet_main",
                                        body: JSON.stringify(messageBody),
                                      });
                                      console.log(
                                        "📤 FinancialPurposeForm에서 field-focus 메시지 전송:",
                                        {
                                          fieldId,
                                          fieldLabel,
                                          fieldType,
                                        }
                                      );
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    padding: "2rem",
                                    textAlign: "center",
                                    color: "#666",
                                  }}
                                >
                                  알 수 없는 서식 타입입니다.
                                </div>
                              )}

                              {/* 서식 저장 버튼 - 실제 사용하는 서식에 추가 */}
                              <div
                                style={{
                                  marginTop: "1rem",
                                  textAlign: "center",
                                }}
                              >
                                <button
                                  onClick={handleSaveForm}
                                  disabled={isSavingForm}
                                  style={{
                                    padding: "0.75rem 1.5rem",
                                    background: isSavingForm
                                      ? "#ccc"
                                      : "#4CAF50",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: isSavingForm
                                      ? "not-allowed"
                                      : "pointer",
                                    fontSize: "1rem",
                                    fontWeight: "700",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    margin: "0 auto",
                                  }}
                                >
                                  {isSavingForm
                                    ? "💾 저장 중..."
                                    : "💾 서식 저장"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            enrollmentData.forms[currentFormIndex]
                              ?.formSchema && (
                              <div
                                style={{
                                  background: "#f8f9fa",
                                  border: "1px solid #ddd",
                                  borderRadius: "8px",
                                  padding: "1.5rem",
                                  marginBottom: "1rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "1rem",
                                    color: "#008485",
                                  }}
                                >
                                  📄 PDF 서식 뷰어
                                </div>

                                {/* PDF 뷰어 기능 제거됨 */}
                                <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                  PDF 뷰어 기능이 제거되었습니다.
                                </div>

                                {/* 필드 목록 (백업용) */}
                                <details style={{ marginTop: "1rem" }}>
                                  <summary
                                    style={{
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                      color: "#666",
                                    }}
                                  >
                                    📋 필드 목록 보기
                                  </summary>
                                  {(() => {
                                    try {
                                      const schema = JSON.parse(
                                        enrollmentData.forms[currentFormIndex]
                                          .formSchema
                                      );
                                      return schema.fields?.map(
                                        (field, index) => (
                                          <div
                                            key={index}
                                            onClick={() => {
                                              console.log(
                                                "🖱️ 필드 클릭됨:",
                                                field
                                              );
                                              console.log(
                                                "🔍 stompClient 상태:",
                                                !!stompClient
                                              );
                                              console.log(
                                                "🔍 sessionId:",
                                                sessionId
                                              );

                                              // PC에서 필드 클릭 시 태블릿에 필드 확대 메시지 전송
                                              if (stompClient && sessionId) {
                                                const fieldFocusMessage = {
                                                  type: "field-focus",
                                                  data: {
                                                    fieldId: field.id,
                                                    fieldName: field.name,
                                                    fieldLabel: field.label,
                                                    fieldType: field.type,
                                                    fieldPlaceholder:
                                                      field.placeholder,
                                                    formIndex: currentFormIndex,
                                                    formName:
                                                      enrollmentData.forms[
                                                        currentFormIndex
                                                      ].formName,
                                                  },
                                                  timestamp: Date.now(),
                                                };

                                                stompClient.publish({
                                                  destination:
                                                    "/topic/session/tablet_main",
                                                  body: JSON.stringify({
                                                    sessionId: sessionId,
                                                    data: {
                                                      fieldId: field.id,
                                                      fieldName: field.name,
                                                      fieldLabel: field.label,
                                                      fieldType: field.type,
                                                      fieldPlaceholder:
                                                        field.placeholder,
                                                      formIndex:
                                                        currentFormIndex,
                                                      formName:
                                                        enrollmentData.forms[
                                                          currentFormIndex
                                                        ].formName,
                                                    },
                                                    timestamp:
                                                      new Date().toISOString(),
                                                  }),
                                                });

                                                console.log(
                                                  "📤 PC에서 field-focus 메시지 전송:",
                                                  fieldFocusMessage
                                                );
                                              }
                                            }}
                                            style={{
                                              marginBottom: "0.5rem",
                                              padding: "0.5rem",
                                              background: "white",
                                              borderRadius: "4px",
                                              border: "1px solid #e9ecef",
                                              cursor: "pointer",
                                              transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.background =
                                                "#f8f9fa";
                                              e.target.style.borderColor =
                                                "var(--hana-mint)";

                                              // 호버 시 필드 포커스 메시지 전송
                                              console.log(
                                                "🖱️ 필드 호버됨:",
                                                field
                                              );
                                              console.log(
                                                "🔍 stompClient 상태:",
                                                !!stompClient
                                              );
                                              console.log(
                                                "🔍 sessionId:",
                                                sessionId
                                              );

                                              if (stompClient && sessionId) {
                                                const fieldFocusMessage = {
                                                  type: "field-focus",
                                                  data: {
                                                    fieldId: field.id,
                                                    fieldName: field.name,
                                                    fieldLabel: field.label,
                                                    fieldType: field.type,
                                                    fieldPlaceholder:
                                                      field.placeholder,
                                                    formIndex: currentFormIndex,
                                                    formName:
                                                      enrollmentData.forms[
                                                        currentFormIndex
                                                      ].formName,
                                                  },
                                                  timestamp: Date.now(),
                                                };

                                                stompClient.publish({
                                                  destination:
                                                    "/topic/session/tablet_main",
                                                  body: JSON.stringify({
                                                    sessionId: sessionId,
                                                    data: {
                                                      fieldId: field.id,
                                                      fieldName: field.name,
                                                      fieldLabel: field.label,
                                                      fieldType: field.type,
                                                      fieldPlaceholder:
                                                        field.placeholder,
                                                      formIndex:
                                                        currentFormIndex,
                                                      formName:
                                                        enrollmentData.forms[
                                                          currentFormIndex
                                                        ].formName,
                                                    },
                                                    timestamp:
                                                      new Date().toISOString(),
                                                  }),
                                                });

                                                console.log(
                                                  "📤 PC에서 field-focus 메시지 전송 (호버):",
                                                  fieldFocusMessage
                                                );
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.background =
                                                "white";
                                              e.target.style.borderColor =
                                                "#e9ecef";
                                            }}
                                          >
                                            <span
                                              style={{ fontWeight: "bold" }}
                                            >
                                              {field.label}
                                            </span>
                                            {field.required && (
                                              <span style={{ color: "red" }}>
                                                {" "}
                                                *
                                              </span>
                                            )}
                                            <span
                                              style={{
                                                color: "#666",
                                                fontSize: "0.9rem",
                                                marginLeft: "0.5rem",
                                              }}
                                            >
                                              ({field.type})
                                            </span>
                                            {field.value && (
                                              <div
                                                style={{
                                                  fontSize: "0.9rem",
                                                  color: "var(--hana-mint)",
                                                  fontWeight: "bold",
                                                  marginTop: "0.25rem",
                                                  padding: "0.25rem 0.5rem",
                                                  background: "#e8f5e8",
                                                  borderRadius: "4px",
                                                  border: "1px solid #4caf50",
                                                }}
                                              >
                                                ✅ 입력됨:{" "}
                                                {(() => {
                                                  if (
                                                    field.value === null ||
                                                    field.value === undefined
                                                  ) {
                                                    return "-";
                                                  }
                                                  if (
                                                    typeof field.value ===
                                                    "object"
                                                  ) {
                                                    return JSON.stringify(
                                                      field.value,
                                                      null,
                                                      2
                                                    );
                                                  }
                                                  return String(field.value);
                                                })()}
                                              </div>
                                            )}
                                            <div
                                              style={{
                                                fontSize: "0.8rem",
                                                color: "#999",
                                                marginTop: "0.25rem",
                                              }}
                                            >
                                              클릭하여 태블릿에서 입력
                                            </div>
                                          </div>
                                        )
                                      );
                                    } catch (e) {
                                      return (
                                        <div style={{ color: "red" }}>
                                          서식 데이터를 불러올 수 없습니다.
                                        </div>
                                      );
                                    }
                                  })()}
                                </details>
                              </div>
                            )
                          )}

                          {/* PC 전용 네비게이션 버튼 */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: "1rem",
                            }}
                          >
                            <button
                              onClick={() => {
                                if (currentFormIndex > 0) {
                                  setCurrentFormIndex(currentFormIndex - 1);
                                  // 태블릿에 서식 변경 알림
                                  if (stompClient && sessionId) {
                                    stompClient.publish({
                                      destination:
                                        "/topic/session/" + sessionId,
                                      body: JSON.stringify({
                                        type: "form-navigation",
                                        data: {
                                          currentFormIndex:
                                            currentFormIndex - 1,
                                          totalForms:
                                            enrollmentData.forms.length,
                                          currentForm:
                                            enrollmentData.forms[
                                              currentFormIndex - 1
                                            ],
                                        },
                                        timestamp: Date.now(),
                                      }),
                                    });
                                  }
                                }
                              }}
                              disabled={currentFormIndex === 0}
                              style={{
                                padding: "0.75rem 1.5rem",
                                background:
                                  currentFormIndex === 0
                                    ? "#ccc"
                                    : "var(--hana-mint)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor:
                                  currentFormIndex === 0
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              ← 이전 서식
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  currentFormIndex <
                                  enrollmentData.forms.length - 1
                                ) {
                                  setCurrentFormIndex(currentFormIndex + 1);
                                  // 태블릿에 서식 변경 알림
                                  if (stompClient && sessionId) {
                                    stompClient.publish({
                                      destination:
                                        "/topic/session/" + sessionId,
                                      body: JSON.stringify({
                                        type: "form-navigation",
                                        data: {
                                          currentFormIndex:
                                            currentFormIndex + 1,
                                          totalForms:
                                            enrollmentData.forms.length,
                                          currentForm:
                                            enrollmentData.forms[
                                              currentFormIndex + 1
                                            ],
                                        },
                                        timestamp: Date.now(),
                                      }),
                                    });
                                  }
                                }
                              }}
                              disabled={
                                currentFormIndex ===
                                enrollmentData.forms.length - 1
                              }
                              style={{
                                padding: "0.75rem 1.5rem",
                                background:
                                  currentFormIndex ===
                                  enrollmentData.forms.length - 1
                                    ? "#ccc"
                                    : "var(--hana-mint)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor:
                                  currentFormIndex ===
                                  enrollmentData.forms.length - 1
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              다음 서식 →
                            </button>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              ) : currentCustomer ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <h3>고객 정보가 로드되었습니다.</h3>
                  <p>상품을 선택하고 가입 프로세스를 시작하세요.</p>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--hana-space-8)",
                    color: "var(--hana-gray)",
                    background: "var(--hana-white)",
                    borderRadius: "var(--hana-radius-lg)",
                    margin: "var(--hana-space-4)",
                    border: "var(--hana-border-light)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "var(--hana-space-4)",
                    }}
                  >
                    📝
                  </div>
                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "var(--hana-space-2)",
                      fontSize: "var(--hana-font-size-xl)",
                    }}
                  >
                    서식 작성
                  </h3>
                  <p style={{ color: "var(--hana-gray)" }}>
                    고객 정보를 먼저 입력해주세요.
                  </p>
                </div>
              ))}

            {activeTab === "simulation" &&
              (currentCustomer ? (
                <SimulationPanel
                  customer={currentCustomer}
                  onScreenSync={syncScreenToCustomer}
                  sessionId={sessionId}
                  stompClient={stompClient}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--hana-space-8)",
                    color: "var(--hana-gray)",
                    background: "var(--hana-white)",
                    borderRadius: "var(--hana-radius-lg)",
                    margin: "var(--hana-space-4)",
                    border: "var(--hana-border-light)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "var(--hana-space-4)",
                    }}
                  >
                    📊
                  </div>
                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "var(--hana-space-2)",
                      fontSize: "var(--hana-font-size-xl)",
                    }}
                  >
                    혜택 시뮬레이션
                  </h3>
                  <p style={{ color: "var(--hana-gray)" }}>
                    고객 정보를 먼저 입력해주세요.
                  </p>
                </div>
              ))}
            {/* 고객 이력 탭 */}
            {activeTab === "history" &&
              (currentCustomer ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "var(--hana-space-5)",
                    margin: "var(--hana-space-4)",
                    boxShadow: "0 4px 20px rgba(0, 132, 133, 0.08)",
                    border: "2px solid #008485",
                    minHeight: "600px",
                  }}
                >
                  <h3
                    style={{
                      color: "#008485",
                      marginBottom: "var(--hana-space-4)",
                      fontSize: "20px",
                      fontWeight: "700",
                      lineHeight: "1.3",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    📋 고객 이력 및 상품 가입 내역
                  </h3>

                  <div style={{ display: "grid", gap: "var(--hana-space-4)" }}>
                    {/* 상품 가입 이력 */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "var(--hana-space-4)",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <h4
                        style={{
                          color: "#008485",
                          marginBottom: "var(--hana-space-3)",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        🏦 상품 가입 이력
                      </h4>
                      {customerProducts && customerProducts.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gap: "var(--hana-space-2)",
                          }}
                        >
                          {customerProducts
                            .slice(0, 5)
                            .map((product, index) => (
                              <div
                                key={index}
                                style={{
                                  background: "white",
                                  padding: "var(--hana-space-3)",
                                  borderRadius: "8px",
                                  border: "1px solid #dee2e6",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                }}
                                onClick={() => {
                                  fetchProductForm(
                                    product.productId,
                                    currentCustomer?.CustomerID
                                  );
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.borderColor = "#008485";
                                  e.target.style.boxShadow =
                                    "0 2px 8px rgba(0, 132, 133, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.borderColor = "#dee2e6";
                                  e.target.style.boxShadow = "none";
                                }}
                              >
                                <div>
                                  <div
                                    style={{ fontWeight: "600", color: "#333" }}
                                  >
                                    {product.productName}
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", color: "#666" }}
                                  >
                                    {product.isEnrollmentHistory ? (
                                      <>
                                        가입일:{" "}
                                        {new Date(
                                          product.enrollmentDate
                                        ).toLocaleDateString("ko-KR")}
                                        <br />
                                        서식: {product.formName}
                                        <br />
                                        상태: {product.status} (
                                        {product.completionRate}%)
                                      </>
                                    ) : (
                                      <>
                                        가입일:{" "}
                                        {product.startDate ||
                                          product.enrollmentDate}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  {product.isEnrollmentHistory ? (
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: "600",
                                          color: "#008485",
                                        }}
                                      >
                                        📋 서식 보기
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#666",
                                        }}
                                      >
                                        클릭하여 서식 확인
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div
                                        style={{
                                          fontWeight: "600",
                                          color: "#008485",
                                        }}
                                      >
                                        {product.interestRate}%
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#666",
                                        }}
                                      >
                                        {product.balance?.toLocaleString()}원
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          {customerProducts.length > 5 && (
                            <div
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(0, 132, 133, 0.08), rgba(0, 132, 133, 0.12))",
                                padding: "var(--hana-space-3)",
                                borderRadius: "8px",
                                border: "2px solid rgba(0, 132, 133, 0.4)",
                                boxShadow: "0 2px 8px rgba(0, 132, 133, 0.15)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                marginTop: "var(--hana-space-2)",
                                position: "relative",
                              }}
                              onClick={() => {
                                alert(
                                  "상세 내역은 '상담내역/이력' 화면에서 확인해주세요."
                                );
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = "#008485";
                                e.target.style.background =
                                  "linear-gradient(135deg, rgba(0, 132, 133, 0.15), rgba(0, 132, 133, 0.2))";
                                e.target.style.boxShadow =
                                  "0 4px 16px rgba(0, 132, 133, 0.25)";
                                e.target.style.transform = "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor =
                                  "rgba(0, 132, 133, 0.4)";
                                e.target.style.background =
                                  "linear-gradient(135deg, rgba(0, 132, 133, 0.08), rgba(0, 132, 133, 0.12))";
                                e.target.style.boxShadow =
                                  "0 2px 8px rgba(0, 132, 133, 0.15)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <div>
                                <div
                                  style={{ fontWeight: "600", color: "#333" }}
                                >
                                  더 많은 가입 이력 보기
                                </div>
                                <div
                                  style={{ fontSize: "14px", color: "#666" }}
                                >
                                  {customerProducts.length - 5}개 더 보기
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#008485",
                                    fontSize: "14px",
                                  }}
                                >
                                  →
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {`5개 / 전체 ${customerProducts.length}개`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            color: "#666",
                            textAlign: "center",
                            padding: "var(--hana-space-4)",
                          }}
                        >
                          가입된 상품이 없습니다.
                        </p>
                      )}
                    </div>

                    {/* 거래 이력 */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "var(--hana-space-4)",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <h4
                        style={{
                          color: "#008485",
                          marginBottom: "var(--hana-space-3)",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        💳 최근 거래 이력
                      </h4>
                      <div
                        style={{ display: "grid", gap: "var(--hana-space-2)" }}
                      >
                        <div
                          style={{
                            background: "white",
                            padding: "var(--hana-space-3)",
                            borderRadius: "8px",
                            border: "1px solid #dee2e6",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "600", color: "#333" }}>
                              계좌 개설
                            </div>
                            <div style={{ fontSize: "14px", color: "#666" }}>
                              2024.01.15 14:30
                            </div>
                          </div>
                          <div style={{ color: "#28a745", fontWeight: "600" }}>
                            완료
                          </div>
                        </div>
                        <div
                          style={{
                            background: "white",
                            padding: "var(--hana-space-3)",
                            borderRadius: "8px",
                            border: "1px solid #dee2e6",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "600", color: "#333" }}>
                              정기예금 가입
                            </div>
                            <div style={{ fontSize: "14px", color: "#666" }}>
                              2024.01.10 10:15
                            </div>
                          </div>
                          <div style={{ color: "#28a745", fontWeight: "600" }}>
                            완료
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 상담내역 */}
                    <ConsultationSessions
                      customerId={currentCustomer?.CustomerID}
                    />

                    {/* 클레임 이력 */}
                    <div
                      style={{
                        background: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "var(--hana-space-4)",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <h4
                        style={{
                          color: "#008485",
                          marginBottom: "var(--hana-space-3)",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ 클레임 및 문의 이력
                      </h4>
                      <p
                        style={{
                          color: "#666",
                          textAlign: "center",
                          padding: "var(--hana-space-4)",
                        }}
                      >
                        클레임 이력이 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--hana-space-8)",
                    color: "var(--hana-gray)",
                    background: "var(--hana-white)",
                    borderRadius: "var(--hana-radius-lg)",
                    margin: "var(--hana-space-4)",
                    border: "var(--hana-border-light)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "var(--hana-space-4)",
                    }}
                  >
                    📋
                  </div>
                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "var(--hana-space-2)",
                      fontSize: "var(--hana-font-size-xl)",
                    }}
                  >
                    고객 이력 조회
                  </h3>
                  <p style={{ color: "var(--hana-gray)" }}>
                    고객 정보를 먼저 입력해주세요.
                  </p>
                </div>
              ))}
            {/* 기본 업무 탭 */}
            {activeTab === "banking" &&
              (currentCustomer ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "var(--hana-space-5)",
                    margin: "var(--hana-space-4)",
                    boxShadow: "0 4px 20px rgba(0, 132, 133, 0.08)",
                    border: "2px solid #008485",
                    minHeight: "600px",
                  }}
                >
                  <h3
                    style={{
                      color: "#008485",
                      marginBottom: "var(--hana-space-4)",
                      fontSize: "20px",
                      fontWeight: "700",
                      lineHeight: "1.3",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    🏦 기본 업무 상담
                  </h3>

                  {/* 검색 바 */}
                  <div
                    style={{
                      marginBottom: "var(--hana-space-4)",
                      position: "relative",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="업무를 검색하세요... (예: 계좌, 송금, 카드)"
                      style={{
                        width: "100%",
                        padding: "var(--hana-space-3) var(--hana-space-4)",
                        paddingLeft: "var(--hana-space-10)",
                        border: "2px solid #e9ecef",
                        borderRadius: "12px",
                        fontSize: "16px",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#008485";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(0, 132, 133, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e9ecef";
                        e.target.style.boxShadow = "none";
                      }}
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const buttons = document.querySelectorAll(
                          ".banking-service-button"
                        );
                        buttons.forEach((button) => {
                          const text = button.textContent.toLowerCase();
                          if (text.includes(searchTerm) || searchTerm === "") {
                            button.style.display = "block";
                          } else {
                            button.style.display = "none";
                          }
                        });
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: "var(--hana-space-3)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#666",
                        fontSize: "18px",
                      }}
                    >
                      🔍
                    </div>
                  </div>

                  {/* 업무 리스트 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    {/* 계좌 관련 업무 */}
                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🆕</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          신규 계좌 개설
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          새로운 계좌를 개설합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🔄</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          계좌 정보 변경
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          계좌 정보를 수정합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📋</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          통장 재발급
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          통장을 재발급합니다
                        </div>
                      </div>
                    </button>

                    {/* 송금 관련 업무 */}
                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>💰</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          계좌이체
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          계좌 간 이체를 진행합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🌐</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          해외송금
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          해외로 송금을 진행합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📝</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          자동이체 설정
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          자동이체를 설정합니다
                        </div>
                      </div>
                    </button>

                    {/* 카드 관련 업무 */}
                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>💳</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          신규 카드 발급
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          새로운 카드를 발급합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🔒</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          카드 분실/도난 신고
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          카드 분실 또는 도난을 신고합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📊</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          카드 한도 조정
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          카드 사용 한도를 조정합니다
                        </div>
                      </div>
                    </button>

                    {/* 기타 업무 */}
                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🔐</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          비밀번호 변경
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          비밀번호를 변경합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📱</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          모바일뱅킹 등록
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          모바일뱅킹을 등록합니다
                        </div>
                      </div>
                    </button>

                    <button
                      className="banking-service-button"
                      style={{
                        background: "white",
                        border: "2px solid #008485",
                        color: "#008485",
                        padding: "var(--hana-space-4)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--hana-space-3)",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#008485";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(0, 132, 133, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "white";
                        e.target.style.color = "#008485";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📄</span>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          증명서 발급
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                          각종 증명서를 발급합니다
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--hana-space-8)",
                    color: "var(--hana-gray)",
                    background: "var(--hana-white)",
                    borderRadius: "var(--hana-radius-lg)",
                    margin: "var(--hana-space-4)",
                    border: "var(--hana-border-light)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "3rem",
                      marginBottom: "var(--hana-space-4)",
                    }}
                  >
                    🏦
                  </div>
                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      marginBottom: "var(--hana-space-2)",
                      fontSize: "var(--hana-font-size-xl)",
                    }}
                  >
                    기본 업무 상담
                  </h3>
                  <p style={{ color: "var(--hana-gray)" }}>
                    고객 정보를 먼저 입력해주세요.
                  </p>
                </div>
              ))}
          </TabContent>

          {/* 우측 패널: 실시간 채팅 + 메모 + STT */}
          {sttEnabled && (
            <RealtimeChat
              isVisible={showRealtimeChat}
              onClose={() => setShowRealtimeChat(false)}
              messages={chatMessages}
              currentInterimText={currentInterimText}
              currentSpeaker={currentSpeaker}
              isRecording={sttEnabled}
              employee={employee}
              customer={currentCustomer}
              onTranscript={handleSTTTranscript}
              onError={handleSTTError}
              onClearMessages={() => setChatMessages([])}
            />
          )}

          {/* 화자 분리 분석 데모 */}
          {sttEnabled && showSpeakerDemo && (
            <SpeakerClassificationDemo
              onClose={() => setShowSpeakerDemo(false)}
            />
          )}
        </MainContent>
        {/* 테스트 고객 선택 모달 */}
        {showCustomerSelect && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0, 133, 122, 0.3)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              animation: "hanaFadeIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                background: "var(--hana-white)",
                borderRadius: "var(--hana-radius-xl)",
                padding: "var(--hana-space-8)",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "85%",
                overflow: "auto",
                boxShadow: "var(--hana-shadow-heavy)",
                border: "var(--hana-border-light)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--hana-space-6)",
                  borderBottom: "3px solid var(--hana-primary-light)",
                  paddingBottom: "var(--hana-space-4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--hana-space-3)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background:
                        "linear-gradient(135deg, var(--hana-primary), var(--hana-mint))",
                      borderRadius: "var(--hana-radius-full)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--hana-font-size-xl)",
                      color: "var(--hana-white)",
                    }}
                  >
                    👥
                  </div>
                  <div>
                    <h2
                      style={{
                        color: "var(--hana-primary)",
                        margin: 0,
                        fontSize: "var(--hana-font-size-2xl)",
                        fontWeight: "700",
                      }}
                    >
                      고객 목록
                    </h2>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: "var(--hana-gray)",
                        fontSize: "14px",
                      }}
                    >
                      총 {testCustomers.length}명의 고객이 있습니다
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerSelect(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "var(--hana-font-size-2xl)",
                    cursor: "pointer",
                    color: "var(--hana-gray)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "var(--hana-radius-full)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--hana-transition-base)",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "var(--hana-error-light)";
                    e.target.style.color = "var(--hana-error)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "none";
                    e.target.style.color = "var(--hana-gray)";
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gap: "var(--hana-space-4)" }}>
                {testCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.customer_id}
                    onClick={() => selectTestCustomer(customer.customer_id)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, var(--hana-primary), var(--hana-mint))`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <CustomerName>
                              {customer.name} ({customer.age}세,{" "}
                              {customer.gender === "남" ? "👨" : "👩"})
                            </CustomerName>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--hana-gray)",
                                marginTop: "2px",
                              }}
                            >
                              ID: {customer.customer_id}
                            </div>
                          </div>
                        </div>

                        <CustomerDetails>
                          <div className="customer-phone">
                            📞 {customer.phone}
                          </div>
                          <div style={{ marginBottom: "8px" }}>
                            📍 {customer.address}
                          </div>

                          {/* 상품 정보 표시 */}
                          <div
                            style={{
                              background: "var(--hana-bg-gray)",
                              padding: "12px",
                              borderRadius: "8px",
                              marginTop: "8px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "var(--hana-primary)",
                                marginBottom: "8px",
                              }}
                            >
                              💼 보유 상품 현황
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                                fontSize: "12px",
                              }}
                            >
                              <div>
                                총 상품:{" "}
                                <strong>
                                  {customer.productSummary?.totalProducts || 0}
                                  개
                                </strong>
                              </div>
                              <div>
                                총 자산:{" "}
                                <strong>
                                  {customer.productSummary?.totalAssets?.toLocaleString() ||
                                    0}
                                  원
                                </strong>
                              </div>
                              <div>
                                예금/적금:{" "}
                                <strong>
                                  {customer.productSummary
                                    ?.totalDepositProducts || 0}
                                  개
                                </strong>
                              </div>
                              <div>
                                대출:{" "}
                                <strong>
                                  {customer.productSummary?.totalLoanProducts ||
                                    0}
                                  개
                                </strong>
                              </div>
                              <div>
                                투자:{" "}
                                <strong>
                                  {customer.productSummary
                                    ?.totalInvestmentProducts || 0}
                                  개
                                </strong>
                              </div>
                              <div>
                                평균 금리:{" "}
                                <strong>
                                  {customer.productSummary
                                    ?.averageInterestRate || 0}
                                  %
                                </strong>
                              </div>
                            </div>
                          </div>
                        </CustomerDetails>
                      </div>
                      <StatusBadge className="waiting">선택 가능</StatusBadge>
                    </div>
                  </CustomerCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 상품 상세 정보 모달 */}
        {showProductModal && selectedProductDetail && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
            onClick={() => setShowProductModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "var(--hana-radius-lg)",
                padding: "var(--hana-space-6)",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "var(--hana-shadow-large)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--hana-space-4)",
                  borderBottom: "var(--hana-border-light)",
                  paddingBottom: "var(--hana-space-4)",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "var(--hana-primary)",
                    fontSize: "var(--hana-font-size-xl)",
                  }}
                >
                  📊 상품 상세 정보
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "var(--hana-gray)",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "var(--hana-space-4)",
                }}
              >
                {/* 상품 기본 정보 */}
                <div
                  style={{
                    background: "var(--hana-bg-gray)",
                    padding: "var(--hana-space-4)",
                    borderRadius: "var(--hana-radius-md)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 var(--hana-space-3) 0",
                      color: "var(--hana-primary)",
                    }}
                  >
                    기본 정보
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    <div>
                      <strong>상품명:</strong>{" "}
                      {selectedProductDetail.productName}
                    </div>
                    <div>
                      <strong>상품유형:</strong>{" "}
                      {selectedProductDetail.productType}
                    </div>
                    <div>
                      <strong>계좌번호:</strong>{" "}
                      {selectedProductDetail.accountNumber}
                    </div>
                    <div>
                      <strong>상태:</strong> {selectedProductDetail.status}
                    </div>
                  </div>
                </div>

                {/* 금리 및 잔액 정보 */}
                <div
                  style={{
                    background: "var(--hana-bg-gray)",
                    padding: "var(--hana-space-4)",
                    borderRadius: "var(--hana-radius-md)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 var(--hana-space-3) 0",
                      color: "var(--hana-primary)",
                    }}
                  >
                    금리 및 잔액
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    <div>
                      <strong>연이율:</strong>{" "}
                      {selectedProductDetail.interestRate}%
                    </div>
                    <div>
                      <strong>현재 잔액:</strong>{" "}
                      {(selectedProductDetail.balance || 0).toLocaleString()}원
                    </div>
                    <div>
                      <strong>월 납입금:</strong>{" "}
                      {(
                        selectedProductDetail.monthlyPayment || 0
                      ).toLocaleString()}
                      원
                    </div>
                    <div>
                      <strong>현재 적용 금리:</strong>{" "}
                      {selectedProductDetail.currentAppliedRate ||
                        selectedProductDetail.interestRate}
                      %
                    </div>
                  </div>
                </div>

                {/* 기간 정보 */}
                <div
                  style={{
                    background: "var(--hana-bg-gray)",
                    padding: "var(--hana-space-4)",
                    borderRadius: "var(--hana-radius-md)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 var(--hana-space-3) 0",
                      color: "var(--hana-primary)",
                    }}
                  >
                    기간 정보
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    <div>
                      <strong>가입일:</strong>{" "}
                      {selectedProductForm.startDate ||
                        selectedProductForm.enrollmentDate ||
                        "정보 없음"}
                    </div>
                    <div>
                      <strong>만료일:</strong>{" "}
                      {selectedProductForm.maturityDate || "정보 없음"}
                    </div>
                    <div>
                      <strong>생성일:</strong>{" "}
                      {selectedProductForm.createdAt
                        ? new Date(
                            selectedProductForm.createdAt
                          ).toLocaleDateString()
                        : "정보 없음"}
                    </div>
                    <div>
                      <strong>해지일:</strong>{" "}
                      {selectedProductForm.cancellationDate || "해지되지 않음"}
                    </div>
                  </div>
                </div>

                {/* 상품 설명 */}
                {selectedProductDetail.description && (
                  <div
                    style={{
                      background: "var(--hana-bg-gray)",
                      padding: "var(--hana-space-4)",
                      borderRadius: "var(--hana-radius-md)",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 var(--hana-space-3) 0",
                        color: "var(--hana-primary)",
                      }}
                    >
                      상품 설명
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      {selectedProductDetail.description}
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: "var(--hana-space-4)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--hana-space-3)",
                }}
              >
                <button
                  onClick={() => setShowProductModal(false)}
                  style={{
                    padding: "var(--hana-space-3) var(--hana-space-4)",
                    background: "var(--hana-gray)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--hana-radius-md)",
                    cursor: "pointer",
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 음성 프로필 관리자 - 신입 행원이고 프로필 없을 때만 표시 */}
        {sttEnabled &&
          employee?.is_new_employee &&
          !hasEmployeeVoiceProfile && (
            <VoiceProfileManager
              employee={employee}
              onProfileSaved={() => {
                setHasEmployeeVoiceProfile(true);
              }}
            />
          )}
        {/* 상담내역 상세 보기 모달 */}
        {showConsultationModal && selectedConsultation && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "var(--hana-space-4)",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "800px",
                maxHeight: "80vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* 모달 헤더 */}
              <div
                style={{
                  background: "#008485",
                  color: "white",
                  padding: "var(--hana-space-4)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  💬 상담내역 상세보기
                </h2>
                <button
                  onClick={() => setShowConsultationModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div
                style={{
                  padding: "var(--hana-space-4)",
                  flex: 1,
                  overflow: "auto",
                }}
              >
                {/* 상담 정보 */}
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "var(--hana-space-3)",
                    borderRadius: "8px",
                    marginBottom: "var(--hana-space-4)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    <div>
                      <strong>상담일시:</strong>{" "}
                      {new Date(
                        selectedConsultation.consultation_date
                      ).toLocaleString("ko-KR")}
                    </div>
                    <div>
                      <strong>상담시간:</strong>{" "}
                      {selectedConsultation.duration_seconds}초
                    </div>
                    <div>
                      <strong>메시지 수:</strong>{" "}
                      {selectedConsultation.total_messages}개
                    </div>
                    <div>
                      <strong>상태:</strong>
                      <span
                        style={{
                          color:
                            selectedConsultation.status === "completed"
                              ? "#28a745"
                              : "#ffc107",
                          marginLeft: "8px",
                        }}
                      >
                        {selectedConsultation.status === "completed"
                          ? "완료"
                          : "진행중"}
                      </span>
                    </div>
                  </div>
                  {selectedConsultation.summary && (
                    <div style={{ marginTop: "var(--hana-space-2)" }}>
                      <strong>요약:</strong> {selectedConsultation.summary}
                    </div>
                  )}
                </div>

                {/* 대화 내용 */}
                <div>
                  <h3
                    style={{
                      margin: "0 0 var(--hana-space-3) 0",
                      color: "#008485",
                    }}
                  >
                    대화 내용
                  </h3>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      padding: "var(--hana-space-3)",
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                  >
                    {selectedConsultation.consultation_messages &&
                    selectedConsultation.consultation_messages.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--hana-space-2)",
                        }}
                      >
                        {selectedConsultation.consultation_messages
                          .sort(
                            (a, b) =>
                              new Date(a.timestamp) - new Date(b.timestamp)
                          )
                          .map((message, index) => (
                            <div
                              key={message.id}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems:
                                  message.speaker_type === "employee"
                                    ? "flex-end"
                                    : "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  background:
                                    message.speaker_type === "employee"
                                      ? "#008485"
                                      : "#4caf50",
                                  color: "white",
                                  padding: "8px 12px",
                                  borderRadius: "12px",
                                  maxWidth: "70%",
                                  wordWrap: "break-word",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    marginBottom: "4px",
                                  }}
                                >
                                  {message.speaker_type === "employee"
                                    ? "👨‍💼 행원"
                                    : "👤 고객"}
                                  {message.confidence_score && (
                                    <span style={{ marginLeft: "8px" }}>
                                      (
                                      {(message.confidence_score * 100).toFixed(
                                        1
                                      )}
                                      %)
                                    </span>
                                  )}
                                </div>
                                <div>{message.message_text}</div>
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#666",
                                  marginTop: "4px",
                                }}
                              >
                                {new Date(message.timestamp).toLocaleTimeString(
                                  "ko-KR"
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#666",
                          padding: "var(--hana-space-4)",
                        }}
                      >
                        대화 내용이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div
                style={{
                  padding: "var(--hana-space-4)",
                  borderTop: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--hana-space-3)",
                }}
              >
                <button
                  onClick={() => setShowConsultationModal(false)}
                  style={{
                    padding: "var(--hana-space-3) var(--hana-space-4)",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 신입행원 가이드라인 모달 */}
        {showNewEmployeeGuide && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "var(--hana-space-4)",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "var(--hana-space-8)",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                position: "relative",
              }}
            >
              {/* 헤더 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--hana-space-6)",
                  paddingBottom: "var(--hana-space-4)",
                  borderBottom: "2px solid var(--hana-primary-light)",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "var(--hana-primary)",
                      margin: 0,
                      fontSize: "var(--hana-font-size-2xl)",
                      fontWeight: "700",
                    }}
                  >
                    🎉 환영합니다!
                  </h2>
                  <p
                    style={{
                      color: "var(--hana-gray)",
                      margin: "var(--hana-space-2) 0 0 0",
                      fontSize: "var(--hana-font-size-base)",
                    }}
                  >
                    하나은행 스마트 상담 시스템에 오신 것을 환영합니다
                  </p>
                </div>
                <button
                  onClick={() => setShowNewEmployeeGuide(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "var(--hana-gray)",
                    padding: "var(--hana-space-2)",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              {/* 가이드라인 내용 */}
              <div style={{ marginBottom: "var(--hana-space-6)" }}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, var(--hana-primary-light), var(--hana-mint-light))",
                    padding: "var(--hana-space-6)",
                    borderRadius: "var(--hana-radius-lg)",
                    marginBottom: "var(--hana-space-6)",
                    border: "2px solid var(--hana-primary)",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--hana-primary)",
                      margin: "0 0 var(--hana-space-4) 0",
                      fontSize: "var(--hana-font-size-xl)",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--hana-space-2)",
                    }}
                  >
                    🎤 음성 프로필 등록이 필요합니다
                  </h3>
                  <p
                    style={{
                      color: "var(--hana-primary-dark)",
                      margin: 0,
                      fontSize: "var(--hana-font-size-base)",
                      lineHeight: "1.6",
                    }}
                  >
                    고객과의 대화를 정확하게 분석하고 화자를 구분하기 위해 음성
                    프로필 등록이 필요합니다.
                    <br />
                    <strong>약 2-3분의 간단한 음성 등록 과정</strong>을 통해 더
                    나은 상담 서비스를 제공할 수 있습니다.
                  </p>
                </div>

                <div style={{ marginBottom: "var(--hana-space-6)" }}>
                  <h4
                    style={{
                      color: "var(--hana-primary)",
                      margin: "0 0 var(--hana-space-3) 0",
                      fontSize: "var(--hana-font-size-lg)",
                      fontWeight: "600",
                    }}
                  >
                    📋 시스템 사용 가이드
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gap: "var(--hana-space-4)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "var(--hana-space-3)",
                        padding: "var(--hana-space-4)",
                        background: "var(--hana-bg-gray)",
                        borderRadius: "var(--hana-radius-md)",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--hana-primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        1
                      </div>
                      <div>
                        <strong style={{ color: "var(--hana-primary)" }}>
                          음성 프로필 등록
                        </strong>
                        <p
                          style={{
                            margin: "var(--hana-space-1) 0 0 0",
                            color: "var(--hana-gray)",
                            fontSize: "var(--hana-font-size-sm)",
                          }}
                        >
                          고객과의 대화 분석을 위한 음성 등록
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "var(--hana-space-3)",
                        padding: "var(--hana-space-4)",
                        background: "var(--hana-bg-gray)",
                        borderRadius: "var(--hana-radius-md)",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--hana-primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        2
                      </div>
                      <div>
                        <strong style={{ color: "var(--hana-primary)" }}>
                          고객 연결
                        </strong>
                        <p
                          style={{
                            margin: "var(--hana-space-1) 0 0 0",
                            color: "var(--hana-gray)",
                            fontSize: "var(--hana-font-size-sm)",
                          }}
                        >
                          QR 코드 또는 세션 ID로 고객 태블릿 연결
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "var(--hana-space-3)",
                        padding: "var(--hana-space-4)",
                        background: "var(--hana-bg-gray)",
                        borderRadius: "var(--hana-radius-md)",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--hana-primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        3
                      </div>
                      <div>
                        <strong style={{ color: "var(--hana-primary)" }}>
                          상담 시작
                        </strong>
                        <p
                          style={{
                            margin: "var(--hana-space-1) 0 0 0",
                            color: "var(--hana-gray)",
                            fontSize: "var(--hana-font-size-sm)",
                          }}
                        >
                          음성 인식과 AI 추천으로 스마트 상담 진행
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--hana-warning-light)",
                    border: "2px solid var(--hana-warning)",
                    borderRadius: "var(--hana-radius-md)",
                    padding: "var(--hana-space-4)",
                    marginBottom: "var(--hana-space-6)",
                  }}
                >
                  <h4
                    style={{
                      color: "var(--hana-warning-dark)",
                      margin: "0 0 var(--hana-space-2) 0",
                      fontSize: "var(--hana-font-size-base)",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--hana-space-2)",
                    }}
                  >
                    💡 팁
                  </h4>
                  <p
                    style={{
                      color: "var(--hana-warning-dark)",
                      margin: 0,
                      fontSize: "var(--hana-font-size-sm)",
                      lineHeight: "1.5",
                    }}
                  >
                    음성 프로필 등록 후에는 고객과의 모든 대화가 자동으로
                    분석되어 상담 품질 향상에 도움이 됩니다.
                  </p>
                </div>
              </div>

              {/* 버튼 */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--hana-space-3)",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowNewEmployeeGuide(false)}
                  style={{
                    padding: "var(--hana-space-3) var(--hana-space-6)",
                    background: "var(--hana-gray)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--hana-radius-md)",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "var(--hana-font-size-base)",
                  }}
                >
                  나중에 하기
                </button>
                <button
                  onClick={() => {
                    setShowNewEmployeeGuide(false);
                    // 음성 프로필 등록 모달 열기
                    // VoiceProfileManager 컴포넌트가 있다면 여기서 호출
                  }}
                  style={{
                    padding: "var(--hana-space-3) var(--hana-space-6)",
                    background:
                      "linear-gradient(135deg, var(--hana-primary), var(--hana-mint))",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--hana-radius-md)",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "var(--hana-font-size-base)",
                    boxShadow: "var(--hana-shadow-light)",
                  }}
                >
                  🎤 음성 프로필 등록하기
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 상품 서식 보기 페이지 */}
        {showProductFormPage && selectedProductForm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "white",
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* 모달 헤더 */}
              <div
                style={{
                  background: "#008485",
                  color: "white",
                  padding: "var(--hana-space-4)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  📋 상품 가입 서식
                </h2>
                <button
                  onClick={() => setShowProductFormPage(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div
                style={{
                  padding: "var(--hana-space-4)",
                  flex: 1,
                  overflow: "auto",
                }}
              >
                {/* 서식 정보 */}
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "var(--hana-space-3)",
                    borderRadius: "8px",
                    marginBottom: "var(--hana-space-4)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--hana-space-3)",
                    }}
                  >
                    <div>
                      <strong>상품명:</strong> {selectedProductForm.productName}
                    </div>
                    <div>
                      <strong>서식명:</strong> {selectedProductForm.formName}
                    </div>
                    <div>
                      <strong>서식 유형:</strong> {selectedProductForm.formType}
                    </div>
                    <div>
                      <strong>완성도:</strong>{" "}
                      {selectedProductForm.completionRate}%
                    </div>
                    <div>
                      <strong>상태:</strong>
                      <span
                        style={{
                          color:
                            selectedProductForm.status === "COMPLETED"
                              ? "#28a745"
                              : "#ffc107",
                          marginLeft: "8px",
                        }}
                      >
                        {selectedProductForm.status === "COMPLETED"
                          ? "완료"
                          : "진행중"}
                      </span>
                    </div>
                    <div>
                      <strong>제출일:</strong>{" "}
                      {new Date(selectedProductForm.createdAt).toLocaleString(
                        "ko-KR"
                      )}
                    </div>
                  </div>

                  {/* 스크린샷 재생성 버튼 */}
                  {!selectedProductForm.screenshot_url && (
                    <div
                      style={{
                        marginTop: "var(--hana-space-3)",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={async () => {
                          try {
                            console.log("🔄 스크린샷 재생성 시작");

                            // 현재 서식 요소 찾기 (실제로는 서식이 없으므로 알림)
                            alert(
                              "스크린샷을 재생성하려면 해당 서식을 다시 작성해야 합니다.\n\n현재는 JSON 데이터만 표시됩니다."
                            );
                          } catch (error) {
                            console.error("❌ 스크린샷 재생성 실패:", error);
                            alert("스크린샷 재생성에 실패했습니다.");
                          }
                        }}
                        style={{
                          background: "#008485",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "var(--hana-space-2) var(--hana-space-3)",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        📸 스크린샷 재생성
                      </button>
                      <p
                        style={{
                          margin: "var(--hana-space-1) 0 0 0",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        이 서식은 스크린샷이 없습니다. JSON 데이터만 표시됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 서식 내용 */}
                <div>
                  <h3
                    style={{
                      margin: "0 0 var(--hana-space-3) 0",
                      color: "#008485",
                    }}
                  >
                    서식 내용
                  </h3>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      padding: "var(--hana-space-2)",
                      maxHeight: "85vh",
                      overflow: "auto",
                    }}
                  >
                    {selectedProductForm.screenshot_url ? (
                      // 스크린샷이 있으면 이미지 뷰어 사용
                      <div style={{ height: "85vh", minHeight: "600px" }}>
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "1px solid #e9ecef",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={selectedProductForm.screenshot_url}
                            alt="서식 스크린샷"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              // 이미지를 새 창에서 열기
                              window.open(
                                selectedProductForm.screenshot_url,
                                "_blank"
                              );
                            }}
                            onError={(e) => {
                              console.error("스크린샷 로드 실패:", e);
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                          <div
                            style={{
                              display: "none",
                              textAlign: "center",
                              color: "#666",
                              padding: "var(--hana-space-4)",
                            }}
                          >
                            <p>📸 스크린샷을 불러올 수 없습니다.</p>
                            <p style={{ fontSize: "12px" }}>
                              파일명: {selectedProductForm.screenshot_filename}
                            </p>
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: "var(--hana-space-2)",
                            textAlign: "center",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          <span>📸 클릭하여 크게 보기</span>
                          {selectedProductForm.screenshot_filename && (
                            <span style={{ marginLeft: "var(--hana-space-2)" }}>
                              파일명: {selectedProductForm.screenshot_filename}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : selectedProductForm.formData ? (
                      <div>
                        {(() => {
                          try {
                            const formData = JSON.parse(
                              selectedProductForm.formData
                            );
                            return (
                              <div
                                style={{
                                  display: "grid",
                                  gap: "var(--hana-space-2)",
                                }}
                              >
                                {Object.entries(formData).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      style={{
                                        background: "white",
                                        padding: "var(--hana-space-2)",
                                        borderRadius: "6px",
                                        border: "1px solid #e9ecef",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: "600",
                                          color: "#333",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {key}
                                      </div>
                                      <div style={{ color: "#666" }}>
                                        {(() => {
                                          if (
                                            value === null ||
                                            value === undefined
                                          ) {
                                            return "-";
                                          }
                                          if (typeof value === "object") {
                                            return JSON.stringify(
                                              value,
                                              null,
                                              2
                                            );
                                          }
                                          return String(value);
                                        })()}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          } catch (error) {
                            return (
                              <div
                                style={{
                                  background: "white",
                                  padding: "var(--hana-space-3)",
                                  borderRadius: "6px",
                                  border: "1px solid #e9ecef",
                                }}
                              >
                                {/* 스크린샷 섹션 */}
                                {selectedProductForm.screenshot_url && (
                                  <div
                                    style={{
                                      marginBottom: "var(--hana-space-3)",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        margin: "0 0 var(--hana-space-2) 0",
                                        color: "#333",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      📸 서식 스크린샷
                                    </h4>
                                    <div
                                      style={{
                                        border: "1px solid #e9ecef",
                                        borderRadius: "6px",
                                        overflow: "hidden",
                                        maxWidth: "100%",
                                      }}
                                    >
                                      <img
                                        src={selectedProductForm.screenshot_url}
                                        alt="서식 스크린샷"
                                        style={{
                                          width: "100%",
                                          height: "auto",
                                          display: "block",
                                        }}
                                        onError={(e) => {
                                          console.error(
                                            "스크린샷 로드 실패:",
                                            e
                                          );
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                    <p
                                      style={{
                                        margin: "var(--hana-space-1) 0 0 0",
                                        fontSize: "12px",
                                        color: "#666",
                                      }}
                                    >
                                      파일명:{" "}
                                      {selectedProductForm.screenshot_filename}
                                    </p>
                                  </div>
                                )}

                                {/* JSON 데이터 섹션 */}
                                <h4
                                  style={{
                                    margin: "0 0 var(--hana-space-2) 0",
                                    color: "#333",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                  }}
                                >
                                  📋 서식 데이터 (JSON)
                                </h4>
                                <pre
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    fontSize: "14px",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  {(() => {
                                    if (
                                      selectedProductForm.formData === null ||
                                      selectedProductForm.formData === undefined
                                    ) {
                                      return "데이터가 없습니다.";
                                    }
                                    if (
                                      typeof selectedProductForm.formData ===
                                      "object"
                                    ) {
                                      return JSON.stringify(
                                        selectedProductForm.formData,
                                        null,
                                        2
                                      );
                                    }
                                    return String(selectedProductForm.formData);
                                  })()}
                                </pre>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#666",
                          padding: "var(--hana-space-4)",
                        }}
                      >
                        서식 데이터가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div
                style={{
                  padding: "var(--hana-space-4)",
                  borderTop: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--hana-space-3)",
                }}
              >
                <button
                  onClick={() => setShowProductFormPage(false)}
                  style={{
                    padding: "var(--hana-space-3) var(--hana-space-4)",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 고객 로그인 모달 */}
        <CustomerLoginModal
          isOpen={showCustomerLoginModal}
          onClose={() => setShowCustomerLoginModal(false)}
          onCustomerLogin={handleCustomerLogin}
          testCustomers={[
            {
              CustomerID: "C6660",
              Name: "한성민",
              Age: 35,
              Gender: "남성",
              Phone: "010-1234-5678",
              Address: "서울시 강남구 테헤란로 123",
              Email: "hansungmin@example.com",
              DateOfBirth: "1989-03-15",
            },
            {
              CustomerID: "C6661",
              Name: "김영희",
              Age: 28,
              Gender: "여성",
              Phone: "010-9876-5432",
              Address: "서울시 서초구 반포대로 456",
              Email: "kimyounghee@example.com",
              DateOfBirth: "1996-07-22",
            },
            {
              CustomerID: "C6662",
              Name: "박민수",
              Age: 42,
              Gender: "남성",
              Phone: "010-5555-1234",
              Address: "서울시 종로구 세종대로 789",
              Email: "parkminsu@example.com",
              DateOfBirth: "1982-11-08",
            },
            {
              CustomerID: "C6663",
              Name: "이지은",
              Age: 31,
              Gender: "여성",
              Phone: "010-7777-8888",
              Address: "서울시 마포구 홍대입구역로 101",
              Email: "leejieun@example.com",
              DateOfBirth: "1993-05-12",
            },
          ]}
        />
        {/* AI 추천 결과 모달 */}
        {showAiRecommendations && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "800px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "2px solid #e9ecef",
                }}
              >
                <h2 style={{ margin: 0, color: "#1e3c72", fontSize: "24px" }}>
                  🎯 AI 상품 추천 결과
                </h2>
                <button
                  onClick={() => setShowAiRecommendations(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <strong>분석된 의도:</strong> {recommendationIntent}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                }}
              >
                {aiRecommendations.map((recommendation, index) => (
                  <div
                    key={recommendation.productId || index}
                    style={{
                      border: "1px solid #e9ecef",
                      borderRadius: "12px",
                      padding: "20px",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: "0 0 8px 0",
                            color: "#1e3c72",
                            fontSize: "18px",
                            fontWeight: "600",
                          }}
                        >
                          {recommendation.productName}
                        </h3>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {recommendation.productType}
                        </span>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#00c73c",
                          }}
                        >
                          {Math.round((recommendation.score || 0) * 100)}%
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                          }}
                        >
                          추천도
                        </div>
                      </div>
                    </div>

                    {recommendation.description && (
                      <p
                        style={{
                          margin: "0 0 12px 0",
                          color: "#495057",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {recommendation.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginBottom: "2px",
                          }}
                        >
                          금리
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1e3c72",
                          }}
                        >
                          {recommendation.interestRate?.toFixed(2) || "0.00"}%
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginBottom: "2px",
                          }}
                        >
                          최소금액
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1e3c72",
                          }}
                        >
                          {recommendation.minAmount?.toLocaleString() || "0"}원
                        </div>
                      </div>
                    </div>

                    {recommendation.reason && (
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          borderLeft: "4px solid #00c73c",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginBottom: "4px",
                            fontWeight: "500",
                          }}
                        >
                          💡 추천 이유
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#495057",
                            lineHeight: "1.4",
                          }}
                        >
                          {recommendation.reason}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => setShowAiRecommendations(false)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    // 추천 결과를 태블릿으로 전송
                    if (stompClient && sessionId) {
                      const message = {
                        type: "ai-recommendations",
                        sessionId: sessionId,
                        data: {
                          recommendations: aiRecommendations,
                          intent: recommendationIntent,
                        },
                        timestamp: Date.now(),
                      };
                      stompClient.publish({
                        destination: "/app/send-to-session",
                        body: JSON.stringify(message),
                      });
                      console.log("📱 태블릿에 AI 추천 결과 전송:", message);
                    }
                    setShowAiRecommendations(false);
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#00c73c",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  태블릿으로 전송
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 금리 계산기 모달 */}
        <InterestCalculator
          isOpen={showCalculator}
          onClose={() => {
            setShowCalculator(false);
            // 태블릿에 계산기 닫기 메시지 전송
            if (stompClient && sessionId) {
              stompClient.publish({
                destination: "/app/send-message",
                body: JSON.stringify({
                  sessionId: sessionId,
                  type: "calculator-close",
                  data: { message: "계산기가 닫혔습니다" },
                }),
              });
            }
          }}
          onSyncToClient={(data) => {
            // 태블릿에 계산기 상태 동기화 메시지 전송
            if (stompClient && stompClient.connected) {
              try {
                stompClient.publish({
                  destination: `/app/send-message`,
                  body: JSON.stringify({
                    sessionId: sessionId,
                    type: "calculator-update",
                    data: data,
                  }),
                });
                console.log("📱 태블릿에 계산기 상태 동기화:", data);
              } catch (error) {
                console.error("❌ 계산기 상태 동기화 실패:", error);
              }
            }
          }}
        />
      </DashboardContainer>
    </>
  );
};

export default EmployeeDashboard;
