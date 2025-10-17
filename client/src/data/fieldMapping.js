// 서식별 필드 매핑 시스템
// 각 서식의 필드 ID와 라벨, 타입을 정의

// 로그인된 행원 정보 가져오기
export const getEmployeeInfo = () => {
  try {
    const employeeData = localStorage.getItem("employee");
    if (employeeData) {
      const employee = JSON.parse(employeeData);
      return {
        name: employee.name || "김행원",
        employeeId: employee.employeeId || employee.id || "EMP_001",
        department: employee.department || "개인금융부",
        position: employee.position || "대리",
        branch: "강남지점", // 기본값
        phone: "02-1234-5678", // 기본값
        email: "employee@hanabank.com", // 기본값
      };
    }
  } catch (error) {
    console.error("행원 정보 파싱 오류:", error);
  }

  // 기본값 반환
  return {
    name: "김행원",
    employeeId: "EMP_001",
    department: "개인금융부",
    position: "대리",
    branch: "강남지점",
    phone: "02-1234-5678",
    email: "employee@hanabank.com",
  };
};

// 로그인된 고객 정보 가져오기
export const getCustomerInfo = () => {
  try {
    // 1. 현재 선택된 고객 정보 확인 (EmployeeDashboard에서 설정)
    const currentCustomer = localStorage.getItem("currentCustomer");
    console.log(
      "🔍 [fieldMapping] localStorage currentCustomer:",
      currentCustomer
    );

    if (currentCustomer) {
      const customer = JSON.parse(currentCustomer);
      console.log("🔍 [fieldMapping] 현재 고객 정보 사용:", customer);
      const result = {
        name: customer.Name || customer.name,
        customerId:
          customer.CustomerID || customer.customerId || customer.customerid,
        dateOfBirth:
          customer.DateOfBirth || customer.dateOfBirth || customer.dateofbirth,
        contactNumber:
          customer.Phone || customer.contactNumber || customer.contactnumber,
        address: customer.Address || customer.address,
        gender: customer.Gender || customer.gender,
        email: customer.Email || customer.email,
      };
      console.log("🔍 [fieldMapping] 반환할 고객 정보:", result);
      return result;
    }

    // 3. URL 파라미터에서 고객 정보 확인
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("customerId");
    const customerName = urlParams.get("customerName");

    if (customerId && customerName) {
      console.log("🔍 [fieldMapping] URL 파라미터 고객 정보 사용:", {
        customerId,
        customerName,
      });
      return {
        name: customerName,
        customerId: customerId,
        dateOfBirth: "1987-06-08", // 기본값
        contactNumber: "010-2211-2221", // 기본값
        address: "대전광역시 유성구 대덕연구단지 111", // 기본값
        gender: "여성", // 기본값
        email: "customer@example.com", // 기본값
      };
    }
  } catch (error) {
    console.error("❌ [fieldMapping] 고객 정보 파싱 오류:", error);
  }

  // 4. 기본값 반환 (실제로는 사용되지 않아야 함)
  console.warn("⚠️ [fieldMapping] 고객 정보를 찾을 수 없어 빈 값 사용");
  return {
    name: "", // "고객명" 대신 빈 문자열
    customerId: "",
    dateOfBirth: "",
    contactNumber: "",
    address: "",
    gender: "",
    email: "",
  };
};

export const FORM_FIELD_MAPPING = {
  // 개인정보 수집·이용 동의서
  consent: {
    formName: "개인정보 수집·이용 동의서",
    fields: {
      // 고유식별정보 동의
      unique_info_consent_yes: {
        label: "고유식별정보 수집·이용 동의함",
        type: "checkbox",
        category: "consent",
        required: true,
      },
      unique_info_consent_no: {
        label: "고유식별정보 수집·이용 동의하지 않음",
        type: "checkbox",
        category: "consent",
        required: true,
      },
      // 개인정보 동의
      personal_info_consent_yes: {
        label: "개인(신용)정보 수집·이용 동의함",
        type: "checkbox",
        category: "consent",
        required: true,
      },
      personal_info_consent_no: {
        label: "개인(신용)정보 수집·이용 동의하지 않음",
        type: "checkbox",
        category: "consent",
        required: true,
      },
      // 날짜 정보
      year: {
        label: "년도",
        type: "text",
        category: "date",
        placeholder: "YYYY",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      month: {
        label: "월",
        type: "text",
        category: "date",
        placeholder: "MM",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      day: {
        label: "일",
        type: "text",
        category: "date",
        placeholder: "DD",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      consentDate: {
        label: "동의일자",
        type: "date",
        category: "date",
        placeholder: "동의일자를 선택하세요",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      applicationDate: {
        label: "신청일자",
        type: "date",
        category: "date",
        placeholder: "신청일자를 선택하세요",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      confirmationDate: {
        label: "확인일자",
        type: "date",
        category: "date",
        placeholder: "확인일자를 선택하세요",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      // 본인 정보
      customer_name: {
        label: "본인 성명",
        type: "text",
        category: "personal",
        placeholder: "성명을 입력해주세요",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      customerName: {
        label: "고객명",
        type: "text",
        category: "personal",
        placeholder: "홍길동",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      signature: {
        label: "본인 서명",
        type: "signature",
        category: "personal",
        placeholder: "서명을 입력해주세요",
        required: true,
        shared: true, // 공통 필드로 설정
      },
      // 대리인 정보
      agent_name: {
        label: "대리인 성명",
        type: "text",
        category: "agent",
        placeholder: "대리인 성명을 입력해주세요",
        required: false,
      },
      agent_signature: {
        label: "대리인 서명",
        type: "signature",
        category: "agent",
        placeholder: "대리인 서명을 입력해주세요",
        required: false,
      },
      // 법정대리인 정보
      father_name: {
        label: "부 성명",
        type: "text",
        category: "legal_guardian",
        placeholder: "부 성명을 입력해주세요",
        required: false,
      },
      mother_name: {
        label: "모 성명",
        type: "text",
        category: "legal_guardian",
        placeholder: "모 성명을 입력해주세요",
        required: false,
      },
      legal_guardian_name: {
        label: "법정대리인 성명",
        type: "text",
        category: "legal_guardian",
        placeholder: "법정대리인 성명을 입력해주세요",
        required: false,
      },
      legal_guardian_signature: {
        label: "법정대리인 서명",
        type: "text",
        category: "legal_guardian",
        placeholder: "법정대리인 서명을 입력해주세요",
        required: false,
      },
    },
  },

  // 은행거래신청서
  application: {
    formName: "은행거래신청서",
    fields: {
      // 고객 기본 정보
      customer_name: {
        label: "성명(업체명)",
        type: "text",
        category: "personal",
        placeholder: "성명 또는 업체명을 입력해주세요",
        required: true,
      },
      birth_date: {
        label: "생년월일(사업자번호)",
        type: "text",
        category: "personal",
        placeholder: "생년월일 또는 사업자번호를 입력해주세요",
        required: true,
      },
      english_name: {
        label: "영문명",
        type: "text",
        category: "personal",
        placeholder: "영문명을 입력해주세요",
        required: false,
      },
      phone: {
        label: "휴대폰",
        type: "text",
        category: "contact",
        placeholder: "휴대폰 번호를 입력해주세요",
        required: true,
      },
      email: {
        label: "이메일",
        type: "text",
        category: "contact",
        placeholder: "이메일 주소를 입력해주세요",
        required: false,
      },
      address: {
        label: "주소",
        type: "text",
        category: "contact",
        placeholder: "주소를 입력해주세요",
        required: true,
      },
      job: {
        label: "직업",
        type: "text",
        category: "personal",
        placeholder: "직업을 입력해주세요",
        required: false,
      },
      // 상품 정보
      product_name: {
        label: "상품명",
        type: "text",
        category: "product",
        placeholder: "상품명을 입력해주세요",
        required: true,
      },
      amount: {
        label: "가입금액(월부금)",
        type: "text",
        category: "product",
        placeholder: "가입금액 또는 월부금을 입력해주세요",
        required: true,
      },
      period: {
        label: "계약기간",
        type: "text",
        category: "product",
        placeholder: "계약기간을 입력해주세요",
        required: true,
      },
    },
  },
};

// 필드 ID로 필드 정보를 찾는 헬퍼 함수
export const getFieldInfo = (formType, fieldId) => {
  const form = FORM_FIELD_MAPPING[formType];
  if (!form) return null;
  return form.fields[fieldId] || null;
};

// 서식의 모든 필드 정보를 가져오는 헬퍼 함수
export const getFormFields = (formType) => {
  const form = FORM_FIELD_MAPPING[formType];
  if (!form) return [];
  return Object.entries(form.fields).map(([fieldId, fieldInfo]) => ({
    fieldId,
    ...fieldInfo,
  }));
};

// 중복 필드를 찾는 헬퍼 함수
export const findDuplicateFields = (fieldValues) => {
  const duplicates = {};
  const fieldMap = {};

  // 모든 서식의 필드를 순회하며 중복 찾기
  Object.values(FORM_FIELD_MAPPING).forEach((form) => {
    Object.entries(form.fields).forEach(([fieldId, fieldInfo]) => {
      const key = `${fieldInfo.label}_${fieldInfo.type}`;
      if (fieldMap[key]) {
        if (!duplicates[key]) {
          duplicates[key] = [fieldMap[key]];
        }
        duplicates[key].push({ fieldId, ...fieldInfo });
      } else {
        fieldMap[key] = { fieldId, ...fieldInfo };
      }
    });
  });

  return duplicates;
};

// 필드 값으로 중복 필드 자동 채우기
export const autoFillDuplicateFields = (fieldValues, newFieldId, newValue) => {
  const updatedValues = { ...fieldValues };

  // 같은 필드 ID를 가진 모든 필드에 값 적용 (라벨이 달라도 필드 ID가 같으면 같은 데이터)
  Object.values(FORM_FIELD_MAPPING).forEach((form) => {
    Object.entries(form.fields).forEach(([fieldId, info]) => {
      if (fieldId === newFieldId) {
        updatedValues[fieldId] = newValue;
        console.log(
          `🔄 자동 채우기: ${fieldId} = "${newValue}" (${info.label})`
        );
      }
    });
  });

  return updatedValues;
};

// 행원 정보와 고객 정보를 자동으로 채우는 함수
export const autoFillEmployeeAndCustomerInfo = (fieldValues) => {
  const updatedValues = { ...fieldValues };
  const today = new Date();

  // 실제 로그인된 행원과 고객 정보 가져오기
  const employeeInfo = getEmployeeInfo();
  const customerInfo = getCustomerInfo();

  // 현재 날짜 정보 자동 채우기
  updatedValues.year = today.getFullYear().toString();
  updatedValues.month = (today.getMonth() + 1).toString().padStart(2, "0");
  updatedValues.day = today.getDate().toString().padStart(2, "0");
  updatedValues.consentDate = today.toISOString().split("T")[0];
  updatedValues.applicationDate = today.toISOString().split("T")[0];
  updatedValues.confirmationDate = today.toISOString().split("T")[0];

  // 고객 정보 자동 채우기 (실제 로그인 정보 사용)
  updatedValues.customer_name = customerInfo.name;
  updatedValues.customerName = customerInfo.name;
  updatedValues.customerId = customerInfo.customerId;
  updatedValues.customer_id = customerInfo.customerId;
  updatedValues.phone = customerInfo.contactNumber;
  updatedValues.email = customerInfo.email;
  updatedValues.address = customerInfo.address;
  updatedValues.customerAddress = customerInfo.address;
  updatedValues.birth_date = customerInfo.dateOfBirth;

  // 행원 정보 자동 채우기 (실제 로그인 정보 사용)
  updatedValues.employee_name = employeeInfo.name;
  updatedValues.employee_id = employeeInfo.employeeId;
  updatedValues.department = employeeInfo.department;
  updatedValues.position = employeeInfo.position;
  updatedValues.branch = employeeInfo.branch;

  console.log("✅ 실제 로그인 정보로 자동 채우기 완료:", {
    customer: customerInfo.name,
    customerId: customerInfo.customerId,
    employee: employeeInfo.name,
    employeeId: employeeInfo.employeeId,
    date: today.toISOString().split("T")[0],
  });

  return updatedValues;
};
