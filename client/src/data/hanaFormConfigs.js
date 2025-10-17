// 하나은행 서식 설정 데이터
// 424개의 서식을 JSON 기반으로 관리

export const hanaFormConfigs = {
  // 자동이체 신청서 (기존 ActualBankForm과 동일)
  "auto_transfer": {
    id: "auto_transfer",
    title: "자동이체 신청서",
    description: "본인은 하나은행의 해당 자동이체 약관에 동의하여 다음과 같이 신청합니다.",
    category: "대출",
    headerColor: "#666666",
    titleSize: "16pt",
    sharedFields: ["account_holder_name", "phone_number"], // 공유 필드
    sections: [
      {
        id: "date_section",
        title: "신청일자",
        content: [
          {
            type: "table",
            style: { marginBottom: '15px' },
            rows: [
              {
                cells: [
                  { type: "label", content: "20", style: { width: '60px', textAlign: 'center' } },
                  { type: "text", content: "년", style: { width: '20px', textAlign: 'center' } },
                  { type: "label", content: "월", style: { width: '40px', textAlign: 'center' } },
                  { type: "text", content: "일", style: { width: '20px', textAlign: 'center' } },
                  { type: "text", content: "", style: { width: '150px', border: 'none' } },
                  { type: "label", content: "신청자", style: { width: '80px', textAlign: 'center', fontSize: '7pt' } },
                  { type: "label", content: "담당", style: { width: '80px', textAlign: 'center', fontSize: '7pt' } },
                  { type: "label", content: "영업점", style: { width: '80px', textAlign: 'center', fontSize: '7pt' } }
                ]
              },
              {
                cells: [
                  { type: "text", content: "", colSpan: 5, style: { border: 'none' } },
                  { type: "field", fieldId: "applicant_signature", config: { type: "signature" }, style: { height: '25px' } },
                  { type: "field", fieldId: "employee_signature", config: { type: "signature" }, style: { height: '25px' } },
                  { type: "field", fieldId: "branch_signature", config: { type: "signature" }, style: { height: '25px' } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "account_holder_section",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "예금주 성명", style: { width: '80px' } },
                  { type: "field", fieldId: "account_holder_name", config: { type: "text", placeholder: "클릭하여 입력" }, style: { width: '200px' } },
                  { type: "label", content: "연락처", style: { width: '60px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "클릭하여 입력" } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "withdrawal_account_section",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "출금계좌번호", style: { width: '80px' } },
                  { type: "text", content: "※ 작성하실때는 입금할 거래은행의 지점번호까지 기재하여 주시기 바랍니다.", colSpan: 3, style: { padding: '2px 5px', fontSize: '7pt' } }
                ]
              }
            ]
          },
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "출금계좌", style: { width: '80px' } },
                  { type: "label", content: "은행", style: { width: '60px' } },
                  { type: "text", content: "하나", style: { width: '40px', textAlign: 'center' } },
                  { type: "label", content: "계좌번호", style: { width: '80px' } },
                  { type: "field", fieldId: "withdrawal_account", config: { type: "text", placeholder: "클릭하여 입력" }, style: { width: '150px' } },
                  { type: "label", content: "예금주", style: { width: '60px' } },
                  { type: "field", fieldId: "withdrawal_holder", config: { type: "text", placeholder: "클릭하여 입력" } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "deposit_account_section",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "입금계좌", style: { width: '80px' } },
                  { type: "label", content: "은행", style: { width: '60px' } },
                  { type: "field", fieldId: "deposit_bank", config: { type: "text", placeholder: "클릭하여 입력" }, style: { width: '100px' } },
                  { type: "label", content: "계좌번호", style: { width: '80px' } },
                  { type: "field", fieldId: "deposit_account", config: { type: "text", placeholder: "클릭하여 입력" }, style: { width: '150px' } },
                  { type: "label", content: "예금주", style: { width: '60px' } },
                  { type: "field", fieldId: "deposit_holder", config: { type: "text", placeholder: "클릭하여 입력" } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "transfer_amount_section",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "이체금액", style: { width: '80px' } },
                  { type: "field", fieldId: "deposit_amount", config: { type: "number", placeholder: "클릭하여 입력" }, style: { width: '120px' } },
                  { type: "text", content: "원", style: { width: '20px', textAlign: 'center' } },
                  { type: "label", content: "이체일자", style: { width: '60px' } },
                  { type: "label", content: "매월", style: { width: '60px' } },
                  { type: "field", fieldId: "transfer_date", config: { type: "number", placeholder: "클릭하여 입력" }, style: { width: '50px' } },
                  { type: "text", content: "일", style: { width: '20px', textAlign: 'center' } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "transfer_type_section",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "계좌정보및\n자동이체", rowSpan: 2, style: { width: '15px', fontSize: '7pt' } },
                  { type: "label", content: "□ 타행 자동이체", style: { width: '80px' } },
                  { type: "label", content: "□ 당행 자동이체(일시정지)", style: { width: '80px' } },
                  { type: "label", content: "□ 하나 자동이체", style: { width: '80px' } }
                ]
              },
              {
                cells: [
                  { type: "text", content: "신규(3개월 신규), 변경, 해지", style: { fontSize: '7pt', textAlign: 'center' } },
                  { type: "text", content: "자동이체기간 만료후 중지 (3개월 미사용)", style: { fontSize: '7pt', textAlign: 'center' } },
                  { type: "text", content: "수수료면제 좌수 (신규, 미사용)", style: { fontSize: '7pt', textAlign: 'center' } }
                ]
              }
            ]
          }
        ]
      }
    ],
    footer: {
      left: "(6자리간코드)1000-000-대출상황-영업점번호(2017.09)\n업무자(주)하나은행(주) 1544"
    }
  },

  // 은행거래신청서
  "bank_transaction": {
    id: "bank_transaction",
    title: "은행거래신청서",
    description: "하나은행과의 거래를 위한 기본 정보를 기재해주세요.",
    category: "예금",
    headerColor: "#0066cc",
    titleSize: "18pt",
    sharedFields: ["customer_name", "resident_number", "phone_number", "address"],
    sections: [
      {
        id: "customer_info",
        title: "신청인 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "성명", style: { width: '100px' } },
                  { type: "field", fieldId: "customer_name", config: { type: "text", placeholder: "고객 성명을 입력해주세요" }, style: { width: '200px' } },
                  { type: "label", content: "생년월일", style: { width: '80px' } },
                  { type: "field", fieldId: "birth_date", config: { type: "text", placeholder: "예: 19900101" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "resident_number", config: { type: "text", placeholder: "000000-0000000" }, style: { width: '200px' } },
                  { type: "label", content: "연락처", style: { width: '80px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "010-1234-5678" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "주소", style: { width: '100px' } },
                  { type: "field", fieldId: "address", config: { type: "text", placeholder: "고객 주소를 입력해주세요" }, colSpan: 3 }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "account_info",
        title: "계좌개설 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "개설할 계좌종류", style: { width: '120px' } },
                  { type: "field", fieldId: "account_type", config: { 
                    type: "select", 
                    options: [
                      { value: "savings", label: "하나원큐통장" },
                      { value: "check", label: "자유수표계좌" },
                      { value: "term", label: "정기예금" },
                      { value: "installment", label: "정기적금" }
                    ]
                  }, colSpan: 3 }
                ]
              },
              {
                cells: [
                  { type: "label", content: "최초입금액", style: { width: '120px' } },
                  { type: "field", fieldId: "initial_deposit", config: { type: "number", placeholder: "100000" }, style: { width: '150px' } },
                  { type: "label", content: "계좌비밀번호", style: { width: '100px' } },
                  { type: "field", fieldId: "account_password", config: { type: "password", placeholder: "1234" } }
                ]
              }
            ]
          }
        ]
      }
    ],
    footer: {
      left: "하나은행 본점\n서울특별시 중구 을지로 35"
    }
  },

  // 예금잔액증명 의뢰서
  "balance_certificate": {
    id: "balance_certificate",
    title: "예금(신탁)잔액증명 의뢰서",
    description: "예금잔액증명서 발급을 위한 신청서입니다.",
    category: "예금",
    headerColor: "#28a745",
    titleSize: "16pt",
    sharedFields: ["applicant_name", "applicant_phone"],
    sections: [
      {
        id: "applicant_info",
        title: "신청인 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "신청인 성명", style: { width: '100px' } },
                  { type: "field", fieldId: "applicant_name", config: { type: "text", placeholder: "신청인 성명을 입력해주세요" }, style: { width: '200px' } },
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "applicant_id", config: { type: "text", placeholder: "000000-0000000" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "연락처", style: { width: '100px' } },
                  { type: "field", fieldId: "applicant_phone", config: { type: "tel", placeholder: "010-1234-5678" }, style: { width: '200px' } },
                  { type: "label", content: "예금주와의 관계", style: { width: '100px' } },
                  { type: "field", fieldId: "relationship", config: { 
                    type: "select", 
                    options: [
                      { value: "self", label: "본인" },
                      { value: "spouse", label: "배우자" },
                      { value: "parent", label: "부모" },
                      { value: "child", label: "자녀" },
                      { value: "other", label: "기타" }
                    ]
                  } }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "certificate_info",
        title: "증명서 발급 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "계좌번호", style: { width: '100px' } },
                  { type: "field", fieldId: "account_number", config: { type: "text", placeholder: "123-456789-12345" }, style: { width: '200px' } },
                  { type: "label", content: "예금주명", style: { width: '100px' } },
                  { type: "field", fieldId: "account_holder", config: { type: "text", placeholder: "예금주명을 입력해주세요" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "증명서 종류", style: { width: '100px' } },
                  { type: "field", fieldId: "certificate_type", config: { 
                    type: "select", 
                    options: [
                      { value: "balance", label: "잔액증명서" },
                      { value: "transaction", label: "거래내역증명서" },
                      { value: "account_opening", label: "계좌개설증명서" }
                    ]
                  }, style: { width: '200px' } },
                  { type: "label", content: "발급매수", style: { width: '100px' } },
                  { type: "field", fieldId: "copy_count", config: { type: "number", placeholder: "1" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "발급목적", style: { width: '100px' } },
                  { type: "field", fieldId: "certificate_purpose", config: { type: "text", placeholder: "제출처 및 용도를 구체적으로 기재" }, colSpan: 3 }
                ]
              }
            ]
          }
        ]
      }
    ],
    footer: {
      left: "하나은행 본점\n서울특별시 중구 을지로 35"
    }
  }
};

// 서식 카테고리별 분류
export const formCategories = {
  "대출": ["auto_transfer", "loan_application", "loan_contract"],
  "예금": ["bank_transaction", "balance_certificate", "deposit_application"],
  "적금": ["installment_savings", "savings_application"],
  "외환": ["foreign_exchange", "overseas_remittance"],
  "퇴직연금": ["retirement_pension", "pension_application"],
  "전자금융": ["internet_banking", "mobile_banking"],
  "파생상품": ["derivative_contract", "derivative_application"],
  "기타": ["other_forms", "general_application"]
};

// 서식 검색 및 필터링 함수
export const searchForms = (query, category = null) => {
  const forms = Object.values(hanaFormConfigs);
  
  let filtered = forms;
  
  if (category && category !== "전체") {
    filtered = filtered.filter(form => form.category === category);
  }
  
  if (query) {
    filtered = filtered.filter(form => 
      form.title.toLowerCase().includes(query.toLowerCase()) ||
      form.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  return filtered;
};

// 공유 필드 매핑 (동일한 정보가 여러 서식에서 사용될 때)
export const sharedFieldMappings = {
  "customer_name": ["account_holder_name", "applicant_name", "customer_name"],
  "phone_number": ["phone_number", "applicant_phone", "contact_number"],
  "resident_number": ["resident_number", "applicant_id", "id_number"],
  "address": ["address", "customer_address", "residential_address"]
};

// 서식 완성도 계산
export const calculateFormCompletion = (formId, formData) => {
  const formConfig = hanaFormConfigs[formId];
  if (!formConfig) return 0;
  
  let totalFields = 0;
  let completedFields = 0;
  
  // 모든 필드 수 계산
  formConfig.sections.forEach(section => {
    section.content.forEach(item => {
      if (item.type === "table") {
        item.rows.forEach(row => {
          row.cells.forEach(cell => {
            if (cell.type === "field") {
              totalFields++;
              if (formData[cell.fieldId]) {
                completedFields++;
              }
            }
          });
        });
      } else if (item.type === "field") {
        totalFields++;
        if (formData[item.fieldId]) {
          completedFields++;
        }
      }
    });
  });
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
};

