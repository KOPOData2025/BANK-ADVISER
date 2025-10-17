import React, { useState, useEffect } from "react";
import FormViewer from "../customer/FormViewer";
import ConsentForm from "../customer/ConsentForm";
import ApplicationForm from "../customer/ApplicationForm";
import ElectronicFinanceForm from "./ElectronicFinanceForm";
import FinancialPurposeForm from "./FinancialPurposeForm";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  autoFillEmployeeAndCustomerInfo,
  getEmployeeInfo,
  getCustomerInfo,
} from "../../data/fieldMapping";
import { showToast } from "../common/Toast";
import { saveFormWithScreenshot } from "../../utils/screenshotUtils";

const FormManager = ({
  customerData,
  selectedProduct,
  isEmployee = true,
  onFormComplete,
  onScreenSync,
  onFormDataUpdate,
  sessionId = "tablet_main", // WebSocket 세션 ID 추가 (기본값)
  stompClient: externalStompClient, // 외부에서 전달받은 WebSocket 클라이언트
  apiForms = null, // API에서 받은 폼 데이터
}) => {
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [highlightedFields, setHighlightedFields] = useState([]);
  const [formProgress, setFormProgress] = useState({});
  const [stompClient, setStompClient] = useState(externalStompClient); // WebSocket 클라이언트 추가

  // API 폼 데이터를 HanaForms 형식으로 변환하는 함수
  const convertApiFormsToHanaForms = (apiForms) => {
    return apiForms.map((apiForm, index) => {
      let formSchema;
      try {
        formSchema =
          typeof apiForm.formSchema === "string"
            ? JSON.parse(apiForm.formSchema)
            : apiForm.formSchema;
      } catch (e) {
        console.warn("폼 스키마 파싱 실패:", apiForm.formName, e);
        formSchema = { fields: [] };
      }

      // 백엔드에서 이미 올바른 formId를 보내므로 매핑 불필요
      const mappedId = apiForm.formId;

      return {
        id: mappedId,
        title: apiForm.formName,
        description: apiForm.description || `${apiForm.formName}입니다.`,
        type: apiForm.formType || "deposit",
        fields: formSchema.fields || [],
        pdfPath: apiForm.formTemplatePath,
        version: apiForm.versionNumber || "1.0",
        isCommon: apiForm.isCommon || false,
        isHtmlForm: true, // API에서 받은 폼은 HTML 폼으로 처리
      };
    });
  };

  // 공통 필드 매핑 정의 (실제 로그인 정보 사용)
  const getSharedFieldMapping = () => {
    const employeeInfo = getEmployeeInfo();
    const customerInfo = getCustomerInfo();
    const today = new Date();

    return {
      // 고객명 관련
      customerName: customerInfo.name,
      customer_name: customerInfo.name,
      // 고객 ID 관련
      customerId: customerInfo.customerId,
      customer_id: customerInfo.customerId,
      // 연락처 관련
      phone: customerInfo.contactNumber,
      // 이메일 관련
      email: customerInfo.email,
      // 주소 관련
      address: customerInfo.address,
      customerAddress: customerInfo.address,
      // 생년월일 관련
      birth_date: customerInfo.dateOfBirth,
      // 행원 정보
      employee_name: employeeInfo.name,
      employee_id: employeeInfo.employeeId,
      department: employeeInfo.department,
      position: employeeInfo.position,
      branch: employeeInfo.branch,
      // 날짜 관련 (오늘 날짜로 자동 설정)
      consentDate: today.toISOString().split("T")[0],
      applicationDate: today.toISOString().split("T")[0],
      confirmationDate: today.toISOString().split("T")[0],
      year: today.getFullYear().toString(),
      month: (today.getMonth() + 1).toString().padStart(2, "0"),
      day: today.getDate().toString().padStart(2, "0"),
    };
  };

  // 공통 필드 자동 채우기 함수
  const autoFillSharedFields = (formFields) => {
    console.log("🔍 [FormManager] autoFillSharedFields 시작:", {
      formFieldsCount: formFields.length,
      customerData: !!customerData,
      customerName: customerData?.Name || customerData?.name,
    });

    // 새로운 자동 채우기 기능 사용
    const autoFilledData = autoFillEmployeeAndCustomerInfo(formData);
    const sharedFieldMapping = getSharedFieldMapping();

    // 추가로 공통 필드 매핑에서 값이 있는 필드들도 채우기
    formFields.forEach((field) => {
      if (sharedFieldMapping[field.id] && !autoFilledData[field.id]) {
        autoFilledData[field.id] = sharedFieldMapping[field.id];
        console.log(
          `🔄 추가 자동 채우기: ${field.id} = "${
            sharedFieldMapping[field.id]
          }" (${field.label})`
        );
      }
    });

    // 고객 정보가 있는 경우 강제로 채우기
    if (customerData) {
      console.log(
        "🔍 [FormManager] customerData로 강제 자동 채우기:",
        customerData
      );
      formFields.forEach((field) => {
        const fieldId = field.id;
        switch (fieldId) {
          case "customer_name":
          case "customerName":
          case "applicantName":
          case "name":
            if (customerData.Name || customerData.name) {
              autoFilledData[fieldId] = customerData.Name || customerData.name;
              console.log(
                `✅ 고객명 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
              );
            }
            break;
          case "customer_id":
          case "customerId":
          case "applicantIdNumber":
          case "idNumber":
            if (customerData.CustomerID || customerData.customerId) {
              autoFilledData[fieldId] =
                customerData.CustomerID || customerData.customerId;
              console.log(
                `✅ 고객ID 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
              );
            }
            break;
          case "phone":
          case "contactNumber":
          case "applicantPhone":
          case "phoneNumber":
            if (customerData.ContactNumber || customerData.contactNumber) {
              autoFilledData[fieldId] =
                customerData.ContactNumber || customerData.contactNumber;
              console.log(
                `✅ 연락처 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
              );
            }
            break;
          case "address":
          case "applicantAddress":
            if (customerData.Address || customerData.address) {
              autoFilledData[fieldId] =
                customerData.Address || customerData.address;
              console.log(
                `✅ 주소 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
              );
            }
            break;
          case "email":
          case "customerEmail":
          case "applicantEmail":
            if (customerData.Email || customerData.email) {
              autoFilledData[fieldId] =
                customerData.Email || customerData.email;
              console.log(
                `✅ 이메일 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
              );
            }
            break;
          case "consentDate":
          case "applicationDate":
          case "confirmationDate":
          case "date":
            // 날짜는 항상 오늘 날짜로 설정
            autoFilledData[fieldId] = new Date().toISOString().split("T")[0];
            console.log(
              `✅ 날짜 자동 채우기: ${fieldId} = "${autoFilledData[fieldId]}"`
            );
            break;
        }
      });
    }

    console.log("🔍 [FormManager] autoFillSharedFields 완료:", autoFilledData);
    return autoFilledData;
  };

  // 폼이 변경될 때마다 공통 필드 자동 채우기
  useEffect(() => {
    if (hanaForms[currentFormIndex]?.fields) {
      console.log("🔍 [FormManager] 자동 채우기 실행:", {
        currentFormIndex,
        customerData: !!customerData,
        customerName: customerData?.Name || customerData?.name,
        hanaFormsLength: hanaForms.length,
      });
      const autoFilledData = autoFillSharedFields(
        hanaForms[currentFormIndex].fields
      );
      console.log("🔍 [FormManager] 자동 채우기 결과:", autoFilledData);
      setFormData(autoFilledData);
    }
  }, [currentFormIndex, customerData, apiForms]);

  // 하나은행 실제 서식 목록 (complete_hana_forms.json 기반)
  const allHanaForms = [
    {
      id: "foreign_currency_remittance",
      title: "외화송금신청서",
      category: "외환",
      url: null, // HTML 폼으로 렌더링
      korean_filename: "외화송금신청서.pdf",
      description:
        "해외 송금을 위한 외화송금신청서입니다. 송금 방법, 금액, 수취인 정보를 정확히 기재해주세요.",
      required: true,
      isHtmlForm: true, // HTML 폼 사용 표시
      fields: [
        {
          id: "method_ott",
          label: "국외전신송금(OTT)",
          type: "checkbox",
          required: false,
        },
        {
          id: "method_odt",
          label: "국내전신송금(ODT)",
          type: "checkbox",
          required: false,
        },
        {
          id: "method_dd",
          label: "송금수표(D/D)",
          type: "checkbox",
          required: false,
        },
        {
          id: "name_eng",
          label: "영문 이름",
          type: "text",
          required: true,
          placeholder: "영문 이름을 입력하세요",
        },
        {
          id: "name_kor",
          label: "국문 이름",
          type: "text",
          required: true,
          placeholder: "국문 이름을 입력하세요",
        },
        {
          id: "currency",
          label: "통화",
          type: "text",
          required: true,
          placeholder: "USD",
        },
        {
          id: "amount",
          label: "송금액",
          type: "text",
          required: true,
          placeholder: "송금 금액을 입력하세요",
        },
      ],
    },
    {
      id: "financial_purpose_confirmation",
      title: "금융거래목적확인서",
      category: "금융거래",
      url: "/sample-forms/financial-purpose-confirmation.pdf",
      korean_filename: "금융거래목적확인서.pdf",
      description:
        "금융거래의 목적과 자금출처를 확인하는 서식입니다. 고객의 투자성향과 거래목적을 파악합니다.",
      required: true,
      fields: [
        {
          id: "customerName",
          label: "고객명",
          type: "text",
          x: 100,
          y: 150,
          width: 150,
          height: 25,
          required: true,
          placeholder: "홍길동",
        },
        {
          id: "customerId",
          label: "주민등록번호",
          type: "text",
          x: 100,
          y: 190,
          width: 180,
          height: 25,
          required: true,
          mask: "000000-0000000",
          placeholder: "000000-0000000",
        },
        {
          id: "transactionPurpose",
          label: "거래목적",
          type: "select",
          x: 100,
          y: 230,
          width: 200,
          height: 25,
          required: true,
          options: [
            "자산증식",
            "생활비",
            "교육비",
            "의료비",
            "주택구입",
            "사업자금",
            "기타",
          ],
        },
        {
          id: "expectedAmount",
          label: "예상거래금액",
          type: "number",
          x: 100,
          y: 270,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "10,000,000",
        },
        {
          id: "fundSource",
          label: "자금출처",
          type: "select",
          x: 100,
          y: 310,
          width: 200,
          height: 25,
          required: true,
          options: ["급여", "사업수입", "임대수입", "상속", "증여", "기타"],
        },
        {
          id: "riskTolerance",
          label: "위험성향",
          type: "radio",
          x: 100,
          y: 350,
          width: 20,
          height: 20,
          required: true,
          options: [
            { value: "conservative", text: "안정형" },
            { value: "moderate", text: "중립형" },
            { value: "aggressive", text: "공격형" },
          ],
        },
        {
          id: "investmentPeriod",
          label: "투자기간",
          type: "select",
          x: 100,
          y: 390,
          width: 200,
          height: 25,
          required: true,
          options: ["1년 미만", "1-3년", "3-5년", "5-10년", "10년 이상"],
        },
        {
          id: "confirmationDate",
          label: "확인일자",
          type: "date",
          x: 100,
          y: 430,
          width: 120,
          height: 25,
          required: true,
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          x: 100,
          y: 470,
          width: 200,
          height: 50,
          required: true,
        },
      ],
    },
    {
      id: "loan_contract",
      title: "대출계약서",
      category: "대출",
      url: "/sample-forms/loan-contract.pdf",
      korean_filename: "대출계약서.pdf",
      description: "대출 계약 조건을 확인하고 서명해주세요.",
      required: true,
      fields: [
        {
          id: "borrowerName",
          label: "차주 성명",
          type: "text",
          x: 150,
          y: 200,
          width: 120,
          height: 25,
          required: true,
          placeholder: "홍길동",
        },
        {
          id: "loanAmount",
          label: "대출금액",
          type: "number",
          x: 150,
          y: 240,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "10,000,000",
        },
        {
          id: "interestRate",
          label: "연이자율",
          type: "number",
          x: 320,
          y: 240,
          width: 100,
          height: 25,
          required: true,
          suffix: "%",
          placeholder: "5.5",
        },
        {
          id: "loanPeriod",
          label: "대출기간",
          type: "number",
          x: 150,
          y: 280,
          width: 100,
          height: 25,
          required: true,
          suffix: "개월",
          placeholder: "36",
        },
        {
          id: "monthlyPayment",
          label: "월상환금액",
          type: "number",
          x: 320,
          y: 280,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "300,000",
        },
        {
          id: "contractDate",
          label: "계약일자",
          type: "date",
          x: 150,
          y: 320,
          width: 120,
          height: 25,
          required: true,
        },
        {
          id: "contractAgreement",
          label: "계약조건 동의",
          type: "checkbox",
          x: 150,
          y: 360,
          width: 20,
          height: 20,
          required: true,
          text: "계약 조건을 확인하고 동의합니다",
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          x: 150,
          y: 400,
          width: 200,
          height: 80,
          required: true,
        },
      ],
    },
    {
      id: "loan_repayment",
      title: "대출상환계획서",
      category: "대출",
      url: "/sample-forms/loan-repayment.pdf",
      korean_filename: "대출상환계획서.pdf",
      description: "대출 상환 계획을 수립하고 확인해주세요.",
      required: true,
      fields: [
        {
          id: "borrowerName",
          label: "차주 성명",
          type: "text",
          x: 150,
          y: 200,
          width: 120,
          height: 25,
          required: true,
          placeholder: "홍길동",
        },
        {
          id: "remainingBalance",
          label: "잔여대출금",
          type: "number",
          x: 150,
          y: 240,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "8,500,000",
        },
        {
          id: "repaymentMethod",
          label: "상환방법",
          type: "select",
          x: 150,
          y: 280,
          width: 200,
          height: 25,
          required: true,
          options: [
            "원리금균등상환",
            "원금균등상환",
            "만기일시상환",
            "이자만상환",
          ],
        },
        {
          id: "monthlyPayment",
          label: "월상환금액",
          type: "number",
          x: 150,
          y: 320,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "300,000",
        },
        {
          id: "repaymentDate",
          label: "상환시작일",
          type: "date",
          x: 320,
          y: 320,
          width: 120,
          height: 25,
          required: true,
        },
        {
          id: "earlyRepayment",
          label: "조기상환",
          type: "checkbox",
          x: 150,
          y: 360,
          width: 20,
          height: 20,
          required: false,
          text: "조기상환 시 수수료 면제 동의",
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          x: 150,
          y: 400,
          width: 200,
          height: 80,
          required: true,
        },
      ],
    },
    {
      id: "foreign_exchange",
      title: "외화송금신청서",
      category: "외환",
      url: "/sample-forms/foreign-exchange.pdf",
      korean_filename: "외화송금신청서.pdf",
      description:
        "해외 송금을 위한 신청서입니다. 수취인 정보를 정확히 기재해주세요.",
      required: false,
      fields: [
        {
          id: "senderName",
          label: "송금인 성명",
          type: "text",
          x: 150,
          y: 200,
          width: 120,
          height: 25,
          required: true,
          placeholder: "홍길동",
        },
        {
          id: "senderId",
          label: "주민등록번호",
          type: "text",
          x: 150,
          y: 240,
          width: 180,
          height: 25,
          required: true,
          mask: "000000-0000000",
          placeholder: "000000-0000000",
        },
        {
          id: "recipientName",
          label: "수취인 성명",
          type: "text",
          x: 150,
          y: 280,
          width: 150,
          height: 25,
          required: true,
          placeholder: "John Smith",
        },
        {
          id: "recipientBank",
          label: "수취은행",
          type: "text",
          x: 320,
          y: 280,
          width: 200,
          height: 25,
          required: true,
          placeholder: "Bank of America",
        },
        {
          id: "recipientAccount",
          label: "수취계좌번호",
          type: "text",
          x: 150,
          y: 320,
          width: 250,
          height: 25,
          required: true,
          placeholder: "1234567890",
        },
        {
          id: "transferAmount",
          label: "송금금액",
          type: "number",
          x: 150,
          y: 360,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "1,000",
        },
        {
          id: "currency",
          label: "통화",
          type: "select",
          x: 320,
          y: 360,
          width: 100,
          height: 25,
          required: true,
          options: ["USD", "EUR", "JPY", "CNY", "GBP"],
        },
        {
          id: "purpose",
          label: "송금목적",
          type: "select",
          x: 150,
          y: 400,
          width: 200,
          height: 25,
          required: true,
          options: ["학비", "생활비", "사업자금", "기타"],
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          x: 150,
          y: 440,
          width: 200,
          height: 80,
          required: true,
        },
      ],
    },
    {
      id: "retirement_pension",
      title: "퇴직연금 거래신청서(개인형IRP)",
      category: "퇴직연금",
      url: "/sample-forms/retirement-pension.pdf",
      korean_filename: "퇴직연금_거래신청서_개인형IRP.pdf",
      description: "개인형 퇴직연금 계좌 개설 및 거래 신청서입니다.",
      required: false,
      fields: [
        {
          id: "accountHolderName",
          label: "계좌주 성명",
          type: "text",
          x: 150,
          y: 200,
          width: 120,
          height: 25,
          required: true,
          placeholder: "홍길동",
        },
        {
          id: "accountHolderId",
          label: "주민등록번호",
          type: "text",
          x: 150,
          y: 240,
          width: 180,
          height: 25,
          required: true,
          mask: "000000-0000000",
          placeholder: "000000-0000000",
        },
        {
          id: "accountType",
          label: "계좌종류",
          type: "select",
          x: 150,
          y: 280,
          width: 200,
          height: 25,
          required: true,
          options: ["개인형IRP", "기업형IRP", "DC형", "DB형"],
        },
        {
          id: "contributionAmount",
          label: "납입금액",
          type: "number",
          x: 150,
          y: 320,
          width: 150,
          height: 25,
          required: true,
          format: "currency",
          placeholder: "500,000",
        },
        {
          id: "investmentType",
          label: "운용방식",
          type: "select",
          x: 150,
          y: 360,
          width: 200,
          height: 25,
          required: true,
          options: ["자동운용", "수동운용", "혼합운용"],
        },
        {
          id: "riskLevel",
          label: "위험도",
          type: "select",
          x: 320,
          y: 360,
          width: 100,
          height: 25,
          required: true,
          options: ["보수형", "안정형", "중립형", "공격형"],
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          x: 150,
          y: 400,
          width: 200,
          height: 80,
          required: true,
        },
      ],
    },
    {
      id: "consent_form",
      title: "개인정보 수집·이용 동의서",
      category: "동의서",
      url: null,
      korean_filename: "개인정보수집이용동의서.pdf",
      description: "개인정보 수집 및 이용에 대한 동의서입니다.",
      required: true,
      isHtmlForm: true,
      fields: [
        {
          id: "customer_name",
          label: "고객명",
          type: "text",
          required: true,
          placeholder: "고객명을 입력하세요",
        },
        {
          id: "customer_id",
          label: "주민등록번호",
          type: "text",
          required: true,
          placeholder: "주민등록번호를 입력하세요",
        },
        {
          id: "phone",
          label: "연락처",
          type: "text",
          required: true,
          placeholder: "연락처를 입력하세요",
        },
        {
          id: "address",
          label: "주소",
          type: "text",
          required: true,
          placeholder: "주소를 입력하세요",
        },
        {
          id: "consent_agree",
          label: "개인정보 수집·이용 동의",
          type: "checkbox",
          required: true,
        },
        {
          id: "consentDate",
          label: "동의일자",
          type: "date",
          required: true,
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          required: true,
          width: 200,
          height: 80,
        },
      ],
    },
    {
      id: "application_form",
      title: "은행거래신청서",
      category: "신청서",
      url: null,
      korean_filename: "은행거래신청서.pdf",
      description: "은행 거래를 위한 신청서입니다.",
      required: true,
      isHtmlForm: true,
      fields: [
        {
          id: "account_type",
          label: "계좌유형",
          type: "select",
          required: true,
          options: ["정기예금", "정기적금", "자유적금", "대출", "펀드", "보험"],
        },
        {
          id: "deposit_amount",
          label: "예금금액",
          type: "number",
          required: true,
          placeholder: "예금금액을 입력하세요",
        },
        {
          id: "maturity_date",
          label: "만기일",
          type: "date",
          required: true,
        },
        {
          id: "auto_renewal",
          label: "자동재예치",
          type: "checkbox",
          required: false,
        },
        {
          id: "applicationDate",
          label: "신청일자",
          type: "date",
          required: true,
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          required: true,
          width: 200,
          height: 80,
        },
      ],
    },
    {
      id: "electronic_finance_form",
      title: "개인 전자금융서비스 신청서",
      category: "전자금융",
      url: null,
      korean_filename: "개인전자금융서비스신청서.pdf",
      description: "개인 전자금융서비스 이용을 위한 신청서입니다.",
      required: true,
      isHtmlForm: true,
      fields: [
        {
          id: "applicationType",
          label: "신청구분",
          type: "radio",
          required: true,
          options: [
            { value: "new", text: "신규" },
            { value: "account_add", text: "계좌추가/매체" },
            { value: "password_reset", text: "비밀번호(재등록/오류매체)" },
            { value: "security_media", text: "보안매체(발급/재발급)" },
            { value: "limit_change", text: "이체한도 변경" },
            { value: "other", text: "기타" },
          ],
        },
        {
          id: "serviceType",
          label: "서비스 유형",
          type: "checkbox",
          required: true,
          options: [
            { value: "smartphone_internet", text: "스마트폰+인터넷뱅킹" },
            { value: "transfer_member", text: "이체회원" },
            { value: "inquiry_member", text: "조회회원" },
            { value: "smartphone_banking", text: "스마트폰뱅킹" },
            { value: "phone_banking", text: "폰뱅킹" },
            { value: "other_service", text: "기타" },
          ],
        },
        {
          id: "customerName",
          label: "성명",
          type: "text",
          required: true,
        },
        {
          id: "customerAddress",
          label: "주소",
          type: "text",
          required: true,
        },
        {
          id: "customerEmail",
          label: "E-Mail주소",
          type: "email",
          required: false,
        },
        {
          id: "userId",
          label: "이용자 ID",
          type: "text",
          required: true,
        },
        {
          id: "dailyTransferLimit",
          label: "1일이체한도",
          type: "text",
          required: true,
        },
        {
          id: "singleTransferLimit",
          label: "1회이체한도",
          type: "text",
          required: true,
        },
        {
          id: "applicationDate",
          label: "신청일자",
          type: "date",
          required: true,
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          required: true,
          width: 200,
          height: 80,
        },
      ],
    },
    {
      id: "financial_purpose_form",
      title: "금융거래목적확인서",
      category: "목적확인",
      url: null,
      korean_filename: "금융거래목적확인서.pdf",
      description: "금융거래 목적을 확인하는 서식입니다.",
      required: true,
      isHtmlForm: true,
      fields: [
        {
          id: "customerName",
          label: "고객명",
          type: "text",
          required: true,
        },
        {
          id: "customerId",
          label: "주민등록번호",
          type: "text",
          required: true,
        },
        {
          id: "transactionPurpose",
          label: "거래목적",
          type: "select",
          required: true,
          options: [
            "자산증식",
            "생활비",
            "교육비",
            "의료비",
            "주택구입",
            "사업자금",
            "기타",
          ],
        },
        {
          id: "expectedAmount",
          label: "예상거래금액",
          type: "number",
          required: true,
        },
        {
          id: "fundSource",
          label: "자금출처",
          type: "select",
          required: true,
          options: ["급여", "사업수입", "임대수입", "상속", "증여", "기타"],
        },
        {
          id: "riskTolerance",
          label: "위험성향",
          type: "radio",
          required: true,
          options: [
            { value: "conservative", text: "안정형" },
            { value: "moderate", text: "중립형" },
            { value: "aggressive", text: "공격형" },
          ],
        },
        {
          id: "investmentPeriod",
          label: "투자기간",
          type: "select",
          required: true,
          options: ["1년 미만", "1-3년", "3-5년", "5-10년", "10년 이상"],
        },
        {
          id: "confirmationDate",
          label: "확인일자",
          type: "date",
          required: true,
        },
        {
          id: "signature",
          label: "서명",
          type: "signature",
          required: true,
          width: 200,
          height: 80,
        },
      ],
    },
  ];

  // API에서 받은 폼 데이터가 있으면 사용, 없으면 기본 4개 서식 사용
  const hanaForms = apiForms
    ? convertApiFormsToHanaForms(apiForms)
    : allHanaForms.slice(6, 10); // 6, 7, 8, 9번 인덱스 (4개 서식: consent_form, application_form, electronic_finance_form, financial_purpose_form)

  // 디버깅: 서식 개수 확인
  console.log("🔍 [FormManager] allHanaForms 개수:", allHanaForms.length);
  console.log("🔍 [FormManager] apiForms 상태:", apiForms);
  console.log("🔍 [FormManager] apiForms 타입:", typeof apiForms);
  console.log("🔍 [FormManager] apiForms 개수:", apiForms?.length);
  console.log("🔍 [FormManager] apiForms 내용:", apiForms);
  console.log("🔍 [FormManager] hanaForms 개수:", hanaForms.length);
  console.log(
    "🔍 [FormManager] hanaForms 서식들:",
    hanaForms.map((f) => f.id)
  );
  console.log("🔍 [FormManager] API 서식 사용 여부:", !!apiForms);
  console.log(
    "🔍 [FormManager] convertApiFormsToHanaForms 결과:",
    apiForms ? convertApiFormsToHanaForms(apiForms) : "apiForms가 null"
  );

  // 현재 서식 데이터
  const currentForm = hanaForms[currentFormIndex];

  // 디버깅: currentForm 정보 출력
  console.log("🔍 [FormManager] currentForm 정보:", {
    currentFormIndex,
    currentFormId: currentForm?.id,
    currentFormTitle: currentForm?.title,
    hanaFormsLength: hanaForms.length,
    hanaFormsIds: hanaForms.map((f) => f.id),
  });

  // 서식 데이터 초기화
  useEffect(() => {
    if (currentForm) {
      const initialData = {};
      currentForm.fields.forEach((field) => {
        initialData[field.id] = "";
      });
      setFormData(initialData);
    }
  }, [currentFormIndex]);

  // 외부에서 전달받은 WebSocket 클라이언트 사용
  useEffect(() => {
    if (externalStompClient) {
      setStompClient(externalStompClient);
      console.log("FormManager: 외부 WebSocket 클라이언트 사용");
    }
  }, [externalStompClient]);

  // WebSocket 메시지 핸들러
  useEffect(() => {
    if (stompClient && sessionId) {
      console.log("🔌 [FormManager] WebSocket 구독 시작:", {
        stompClient: !!stompClient,
        connected: stompClient?.connected,
        sessionId: sessionId,
        topic: `/topic/session/tablet_main`,
      });

      const subscription = stompClient.subscribe(
        `/topic/session/tablet_main`,
        (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("📨 [FormManager] WebSocket 메시지 수신:", {
              type: data.type,
              timestamp: data.timestamp,
              data: data.data,
              fullMessage: data,
            });

            switch (data.type) {
              case "signature-completed": {
                // 서명 전용 이벤트 수신 시 폼 데이터 반영
                const sigFieldId = data.data?.fieldId;
                const sigValue =
                  data.data?.signature || data.data?.signatureData;
                if (sigFieldId && sigValue) {
                  setFormData((prevData) => ({
                    ...prevData,
                    [sigFieldId]: sigValue,
                  }));
                  console.log("✅ [FormManager] 서명 데이터 반영:", sigFieldId);

                  // 서명 완료 알림 표시
                  if (window.showToast) {
                    window.showToast("✅ 서명이 완료되었습니다", "success");
                  }
                }
                break;
              }
              case "field-input-complete":
                console.log(
                  "📝 [FormManager] 태블릿에서 필드 입력 완료 메시지 수신:",
                  data
                );
                if (data.data && data.data.fieldId) {
                  const fieldId = data.data.fieldId;
                  // value(신규) 또는 fieldValue(레거시) 모두 지원
                  const fieldValue =
                    data.data.value !== undefined
                      ? data.data.value
                      : data.data.fieldValue;
                  if (fieldValue === undefined) break;

                  // 폼 데이터 업데이트
                  setFormData((prevData) => {
                    const updatedData = {
                      ...prevData,
                      [fieldId]: fieldValue,
                    };
                    console.log("✅ [FormManager] 폼 데이터 업데이트:", {
                      fieldId,
                      fieldValue,
                      prevValue: prevData[fieldId],
                      updatedData,
                    });
                    return updatedData;
                  });

                  // 화면에 즉시 반영되도록 강제 리렌더링
                  setTimeout(() => {
                    console.log("🔄 [FormManager] 화면 강제 리렌더링");
                  }, 100);
                }
                break;

              case "field-input-sync":
                console.log(
                  "📝 [FormManager] 태블릿에서 필드 입력 실시간 동기화 메시지 수신:",
                  data
                );
                if (
                  data.data &&
                  data.data.fieldId &&
                  data.data.value !== undefined
                ) {
                  const fieldId = data.data.fieldId;
                  const fieldValue = data.data.value;

                  // 실시간 동기화는 필드 값만 업데이트
                  setFormData((prevData) => ({
                    ...prevData,
                    [fieldId]: fieldValue,
                  }));

                  console.log("✅ [FormManager] 실시간 폼 데이터 업데이트:", {
                    fieldId,
                    fieldValue,
                  });
                }
                break;

              case "field-focus":
                console.log(
                  "🎯 [FormManager] 태블릿에서 필드 포커스 메시지 수신 (정상):",
                  data
                );
                // field-focus는 태블릿에서 받은 메시지이므로 특별한 처리 없이 로그만 출력
                break;

              default:
                console.log(
                  "📨 [FormManager] 알 수 없는 메시지 타입:",
                  data.type
                );
            }
          } catch (error) {
            console.error(
              "❌ [FormManager] WebSocket 메시지 파싱 오류:",
              error
            );
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [stompClient, sessionId]);

  // 서식 데이터 변경 핸들러
  const handleFormDataChange = (updatedData) => {
    setFormData(updatedData);

    // 실시간으로 태블릿에 데이터 전송
    if (onScreenSync) {
      onScreenSync({
        type: "form-data-update",
        data: {
          formData: updatedData,
          formId: currentForm?.id,
          formTitle: currentForm?.title,
        },
      });
    }
  };

  // 서식을 태블릿으로 전송
  const sendFormToTablet = () => {
    if (onScreenSync) {
      onScreenSync({
        type: "form-viewer",
        data: {
          formUrl: currentForm.url,
          formData: formData,
          highlightedFields: highlightedFields,
          formId: currentForm.id,
          formTitle: currentForm.title,
          formFields: currentForm.fields,
          isCustomerInput: true,
        },
      });
    }
  };

  // 필드 하이라이트 핸들러
  const handleFieldHighlight = (fieldId) => {
    setHighlightedFields([fieldId]);
  };

  // 필드 클릭 핸들러
  const handleFieldClick = (fieldId, fieldLabel, fieldType) => {
    console.log("📝 [FormManager] 필드 클릭:", fieldId, fieldLabel, fieldType);

    // 자동 채우기인 경우
    if (fieldType === "auto-fill") {
      console.log("🔄 [FormManager] 자동 채우기 처리:", fieldId);
      return;
    }

    // 서명 필드인 경우 특별 처리
    if (fieldType === "signature") {
      console.log("✍️ [FormManager] 서명 필드 클릭 - 태블릿 서명 패드 요청");
      // signature 타입은 아래 field-focus 메시지로 태블릿에서 서명 패드를 열도록 처리
      // (로컬 모달 오픈 제거)
    }

    // STOMP WebSocket으로 태블릿에 입력 요청 전송
    if (stompClient && stompClient.connected) {
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
          formName: currentForm?.title || "서식",
          currentValue: formData[fieldId] || "",
        },
        timestamp: new Date().toISOString(),
      };

      stompClient.publish({
        destination: "/topic/session/" + sessionId,
        body: JSON.stringify(messageBody),
      });

      console.log(
        "📱 [FormManager] 태블릿에 필드 포커스 메시지 전송:",
        messageBody
      );
    } else {
      console.log("❌ [FormManager] STOMP 클라이언트가 연결되지 않음");
    }
  };

  // 서식 완료 핸들러
  const handleFormComplete = async () => {
    try {
      // 1. 스크린샷 저장
      const formElement = document.querySelector(
        ".form-container, .form-content, .form-wrapper"
      );
      if (formElement) {
        console.log("📸 스크린샷 저장 시작...");
        const screenshotResult = await saveFormWithScreenshot(
          formElement,
          formData,
          currentForm.title,
          customerData?.Name || customerData?.name || "고객"
        );

        if (screenshotResult.success) {
          console.log("✅ 스크린샷 저장 완료:", screenshotResult.files);
          showToast(`📸 ${currentForm.title} 스크린샷 저장 완료!`, "success");
        } else {
          console.warn("⚠️ 스크린샷 저장 실패:", screenshotResult.error);
        }
      } else {
        console.warn("⚠️ 스크린샷을 캡처할 폼 요소를 찾을 수 없습니다.");
      }

      // 2. 토스트 메시지 표시
      showToast(`✅ ${currentForm.title} 저장 완료!`, "success");

      // 3. 저장 로직은 EmployeeDashboard로 위임
      console.log("🔍 [FormManager] 서식 완료 - EmployeeDashboard로 위임:", {
        formId: currentForm.id,
        formTitle: currentForm.title,
        formData: formData,
        customerId: customerData?.CustomerID || "C6660",
        productId: selectedProduct?.productId || selectedProduct?.product_id,
      });

      // 4. EmployeeDashboard의 onFormComplete로 저장 로직 위임
      if (onFormComplete) {
        onFormComplete({
          formId: currentForm.id,
          formTitle: currentForm.title,
          formData: formData,
          customerId: customerData?.CustomerID || "C6660",
          productId: selectedProduct?.productId || selectedProduct?.product_id,
          productName: selectedProduct?.productName || selectedProduct?.name,
          // stompClient와 sessionId는 EmployeeDashboard에서 직접 사용
        });
      }

      // 5. API 호출 없이 더미 가입 완료 이벤트 브로드캐스트 (태블릿/행원 UI)
      const completionPayload = {
        formId: currentForm.id,
        formTitle: currentForm.title,
        customerId: customerData?.CustomerID || "C6660",
        customerName: customerData?.Name || customerData?.name,
        productId: selectedProduct?.productId || selectedProduct?.product_id,
        productName:
          selectedProduct?.productName ||
          selectedProduct?.name ||
          selectedProduct?.ProductName,
        timestamp: new Date().toISOString(),
      };

      // 태블릿 동기화 콜백
      if (onScreenSync) {
        // 객체 기반 이벤트
        onScreenSync({ type: "enrollment-complete", data: completionPayload });
      }

      // STOMP 브로드캐스트 (있으면)
      if (stompClient && stompClient.connected && sessionId) {
        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify({
            type: "enrollment-complete",
            sessionId,
            data: completionPayload,
          }),
        });
      }

      // 행원 화면 토스트
      showToast("🎉 상품 가입이 완료되었습니다 (더미)", "success");
    } catch (error) {
      console.error("❌ 서식 완료 처리 실패:", error);
      showToast("❌ 서식 저장에 실패했습니다.", "error");
    }

    // 아래 코드는 제거됨 (EmployeeDashboard로 위임)
    /*
    fetch("/api/form-submission/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submissionId: `SUB_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        customerId: customerData?.CustomerID || "C6660",
        employeeId: "E001", // 기본 직원 ID
        productId:
          selectedProduct?.productId ||
          selectedProduct?.product_id ||
          "PROD_001",
        productName:
          selectedProduct?.productName ||
          selectedProduct?.name ||
          "하나금융상품",
        formId: currentForm.id,
        formName: currentForm.title,
        formType: "consent", // 기본 타입
        formData: JSON.stringify(formData),
        completionRate: 100,
        status: "COMPLETED",
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`폼 저장 실패: ${response.status}`);
      })
      .then((data) => {
        console.log("✅ [FormManager] 폼 데이터 저장 성공:", data);

        // 고객 가입상품 목록에 추가
        if (data.success && data.data) {
          const submissionData = data.data;

          // 상품 가입 완료 시 태블릿으로 완료 메시지 전송
          if (stompClient && sessionId && stompClient.connected) {
            const completionMessage = {
              type: "enrollment-completed",
              data: {
                message: "상품 가입이 완료되었습니다.",
                submissionId: submissionData.submissionId,
                productId: submissionData.productId,
                productName: submissionData.productName,
                timestamp: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
            };

            stompClient.publish({
              destination: "/topic/session/" + sessionId,
              body: JSON.stringify(completionMessage),
            });

            console.log(
              "📤 태블릿에 가입 완료 메시지 전송:",
              completionMessage
            );
          }
        }
      })
      .catch((error) => {
        console.error("❌ [FormManager] 폼 데이터 저장 실패:", error);
        showToast("❌ 서식 저장 중 오류가 발생했습니다.", "error");
      });
    */
  };

  // 다음 서식으로 이동
  const nextForm = () => {
    if (currentFormIndex < hanaForms.length - 1) {
      const newIndex = currentFormIndex + 1;
      setCurrentFormIndex(newIndex);

      // 태블릿에 서식 변경 알림
      console.log("🔍 [FormManager] WebSocket 상태 확인:", {
        stompClient: !!stompClient,
        stompClientConnected: stompClient?.connected,
        sessionId,
        newIndex,
        totalForms: hanaForms.length,
      });

      if (stompClient && sessionId && stompClient.connected) {
        const message = {
          type: "form-navigation",
          data: {
            currentFormIndex: newIndex,
            totalForms: hanaForms.length,
            currentForm: hanaForms[newIndex],
          },
          timestamp: Date.now(),
        };

        console.log(
          "📤 [FormManager] 다음 서식으로 변경 메시지 전송:",
          message
        );

        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify(message),
        });
        console.log(
          "✅ [FormManager] 다음 서식으로 변경 메시지 전송 완료:",
          newIndex
        );
      } else {
        console.log("❌ [FormManager] WebSocket 또는 sessionId가 없습니다:", {
          stompClient: !!stompClient,
          sessionId,
        });
      }
    }
  };

  // 이전 서식으로 이동
  const prevForm = () => {
    if (currentFormIndex > 0) {
      const newIndex = currentFormIndex - 1;
      setCurrentFormIndex(newIndex);

      // 태블릿에 서식 변경 알림
      if (stompClient && sessionId && stompClient.connected) {
        stompClient.publish({
          destination: "/topic/session/" + sessionId,
          body: JSON.stringify({
            type: "form-navigation",
            data: {
              currentFormIndex: newIndex,
              totalForms: hanaForms.length,
              currentForm: hanaForms[newIndex],
            },
            timestamp: Date.now(),
          }),
        });
        console.log("📤 [FormManager] 이전 서식으로 변경:", newIndex);
      }
    }
  };

  // 서식 선택 핸들러
  const selectForm = (index) => {
    setCurrentFormIndex(index);

    // 태블릿에 서식 변경 알림
    if (stompClient && sessionId) {
      stompClient.publish({
        destination: "/topic/session/" + sessionId,
        body: JSON.stringify({
          type: "form-navigation",
          data: {
            currentFormIndex: index,
            totalForms: hanaForms.length,
            currentForm: hanaForms[index],
          },
          timestamp: Date.now(),
        }),
      });
      console.log("📤 [FormManager] 서식 선택으로 변경:", index);
    }
  };

  // 서식 진행률 계산
  const calculateProgress = () => {
    if (!currentForm) return 0;
    const requiredFields = currentForm.fields.filter((field) => field.required);
    const completedFields = requiredFields.filter(
      (field) =>
        formData[field.id] && formData[field.id].toString().trim() !== ""
    );
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* 서식 선택기 - API 폼 데이터 사용 시 숨김 */}
      {!apiForms && hanaForms.length > 1 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#007bff", marginBottom: "15px" }}>
            📋 서식 선택
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {hanaForms.map((form, index) => (
              <button
                key={form.id}
                onClick={() => selectForm(index)}
                style={{
                  padding: "10px 15px",
                  border:
                    currentFormIndex === index
                      ? "2px solid #007bff"
                      : "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor:
                    currentFormIndex === index ? "#e3f2fd" : "#fff",
                  color: currentFormIndex === index ? "#007bff" : "#333",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: currentFormIndex === index ? "bold" : "normal",
                }}
              >
                {form.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 현재 서식 정보 */}
      {currentForm && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ color: "#007bff", marginBottom: "10px" }}>
              📄 {currentForm.title}
            </h2>
            <p style={{ color: "#666", marginBottom: "15px" }}>
              {currentForm.description}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#007bff", fontWeight: "bold" }}>
                진행률: {calculateProgress()}%
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={sendFormToTablet}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  📱 태블릿으로 전송
                </button>
                <button
                  onClick={handleFormComplete}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  📄 서류 제출하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 서식 뷰어 */}
      {currentForm && (
        <div>
          {true ? (
            // 항상 폼 렌더링
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h3 style={{ color: "#2196F3", margin: 0 }}>
                  📝 {currentForm.title} (HTML 폼)
                </h3>
                <p
                  style={{
                    color: "#666",
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.9rem",
                  }}
                >
                  {currentForm.description}
                </p>
              </div>

              {/* 폼 ID에 따라 다른 컴포넌트 렌더링 */}
              {/* 기존 하드코딩된 폼들 (apiForms가 있든 없든 동일하게 렌더링) */}
              {/* 기존 하드코딩된 폼들 */}
              <>
                {currentForm.id === "consent_form" && (
                  <ConsentForm
                    onFormSubmit={(formData) => {
                      console.log(
                        "📝 개인정보 수집·이용 동의서 제출됨:",
                        formData
                      );
                      showToast(
                        "✅ 개인정보 수집·이용 동의서 저장 완료!",
                        "success"
                      );
                      setFormData(formData);
                      if (onScreenSync) {
                        onScreenSync("form_data", formData);
                      }
                    }}
                    onFieldClick={handleFieldClick}
                    fieldValues={formData}
                    initialData={formData}
                  />
                )}

                {currentForm.id === "application_form" && (
                  <ApplicationForm
                    onFormSubmit={(formData) => {
                      console.log("📝 은행거래신청서 제출됨:", formData);
                      showToast("✅ 은행거래신청서 저장 완료!", "success");
                      setFormData(formData);
                      if (onScreenSync) {
                        onScreenSync("form_data", formData);
                      }
                    }}
                    onFieldClick={handleFieldClick}
                    fieldValues={formData}
                    initialData={formData}
                  />
                )}

                {currentForm.id === "electronic_finance_form" && (
                  <ElectronicFinanceForm
                    onFormSubmit={(formData) => {
                      console.log(
                        "📝 개인 전자금융서비스 신청서 제출됨:",
                        formData
                      );
                      showToast(
                        "✅ 개인 전자금융서비스 신청서 저장 완료!",
                        "success"
                      );
                      setFormData(formData);
                      if (onScreenSync) {
                        onScreenSync("form_data", formData);
                      }
                    }}
                    onFieldClick={handleFieldClick}
                    fieldValues={formData}
                    initialData={formData}
                  />
                )}

                {currentForm.id === "financial_purpose_form" && (
                  <FinancialPurposeForm
                    onFormSubmit={(formData) => {
                      console.log("📝 금융거래목적확인서 제출됨:", formData);
                      showToast("✅ 금융거래목적확인서 저장 완료!", "success");
                      setFormData(formData);
                      if (onScreenSync) {
                        onScreenSync("form_data", formData);
                      }
                    }}
                    onFieldClick={handleFieldClick}
                    fieldValues={formData}
                    initialData={formData}
                  />
                )}
              </>
            </div>
          ) : (
            // 기존 PDF 폼 렌더링
            <FormViewer
              formUrl={currentForm.url}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              isEmployee={isEmployee}
              highlightedFields={highlightedFields}
              onFieldHighlight={handleFieldHighlight}
              onFieldClick={handleFieldClick}
              formFields={currentForm.fields}
              isReadOnly={true}
              isCustomerInput={false}
              sessionId={sessionId} // WebSocket 세션 ID 전달
              stompClient={stompClient} // WebSocket 클라이언트 전달
            />
          )}

          {/* 네비게이션 버튼 */}
          {currentForm && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={prevForm}
                disabled={currentFormIndex === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor: currentFormIndex === 0 ? "#ccc" : "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: currentFormIndex === 0 ? "not-allowed" : "pointer",
                }}
              >
                ← 이전 서식
              </button>
              <span style={{ color: "#666", alignSelf: "center" }}>
                {currentFormIndex + 1} / {hanaForms.length}
              </span>
              <button
                onClick={nextForm}
                disabled={currentFormIndex === hanaForms.length - 1}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    currentFormIndex === hanaForms.length - 1
                      ? "#ccc"
                      : "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    currentFormIndex === hanaForms.length - 1
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                다음 서식 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormManager;
