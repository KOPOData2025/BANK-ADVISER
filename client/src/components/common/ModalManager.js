import React from "react";
import PrivacyConsentModal from "./PrivacyConsentModal";
import SignaturePadModal from "./SignaturePadModal";
import CalculatorModal from "./CalculatorModal";
import SimulationModal from "./SimulationModal";
import ProductAnalysisModal from "./ProductAnalysisModal";
import ProductDetailModal from "./ProductDetailModal";
import EnrollmentSuccessModal from "../customer/EnrollmentSuccessModal";

const ModalManager = ({
  modals,
  onCloseModal,
  onModalAction,
  isTablet = false,
  stompClient = null,
  sessionId = null,
}) => {
  console.log("🎭 [ModalManager] 모달 상태:", modals);

  return (
    <>
      {/* 개인정보 동의서 모달 */}
      <PrivacyConsentModal
        isOpen={modals.privacyConsent?.isOpen || false}
        onClose={() => onCloseModal("privacyConsent")}
        onAgree={() => {
          onModalAction("privacyConsent", "agree");
          onCloseModal("privacyConsent");
        }}
        data={modals.privacyConsent?.data}
      />

      {/* 서명 패드 모달 */}
      <SignaturePadModal
        isOpen={modals.signaturePad?.isOpen || false}
        onClose={() => onCloseModal("signaturePad")}
        onSave={(signatureData) => {
          // 서명 데이터에 필드 정보 추가
          const fullSignatureData = {
            ...signatureData,
            fieldId: modals.signaturePad?.data?.fieldId,
            fieldLabel: modals.signaturePad?.data?.fieldLabel,
          };
          onModalAction("signaturePad", "save", fullSignatureData);
          onCloseModal("signaturePad");
        }}
        fieldLabel={modals.signaturePad?.data?.fieldLabel || "서명"}
      />

      {/* 계산기 모달 */}
      <CalculatorModal
        isOpen={modals.calculator?.isOpen || false}
        onClose={() => onCloseModal("calculator")}
        data={modals.calculator?.data}
        isTablet={isTablet}
      />


      {/* 시뮬레이션 모달 */}
      <SimulationModal
        isOpen={modals.simulation?.isOpen || false}
        onClose={() => onCloseModal("simulation")}
        data={modals.simulation?.data}
      />

      {/* 상품 비교분석 모달 */}
      {console.log(
        "🔍 [ModalManager] productAnalysis 모달 상태:",
        modals.productAnalysis
      )}
      <ProductAnalysisModal
        isOpen={modals.productAnalysis?.isOpen || false}
        onClose={() => onCloseModal("productAnalysis")}
        selectedProducts={modals.productAnalysis?.data?.selectedProducts || []}
        customerProduct={modals.productAnalysis?.data?.product}
        simulationAmount={
          modals.productAnalysis?.data?.simulationAmount || 1000000
        }
        simulationPeriod={modals.productAnalysis?.data?.simulationPeriod || 12}
        stompClient={stompClient}
        sessionId={sessionId}
      />

      {/* 상품 상세 정보 모달 */}
      <ProductDetailModal
        isOpen={modals.productDetail?.isOpen || false}
        onClose={() => onCloseModal("productDetail")}
        product={modals.productDetail?.data?.product}
        simulationData={modals.productDetail?.data?.simulationData}
        selectedRates={modals.productDetail?.data?.selectedRates || []}
        chartData={modals.productDetail?.data?.chartData || []}
        compoundComparisonData={
          modals.productDetail?.data?.compoundComparisonData || []
        }
        rateOptions={modals.productDetail?.data?.rateOptions || []}
        isTablet={isTablet}
        stompClient={stompClient}
        sessionId={sessionId}
      />

      {/* 가입 완료 성공 모달 */}
      <EnrollmentSuccessModal
        isOpen={modals.enrollmentSuccess?.isOpen || false}
        onClose={() => onCloseModal("enrollmentSuccess")}
        enrollmentData={modals.enrollmentSuccess?.data}
      />
    </>
  );
};

export default ModalManager;
