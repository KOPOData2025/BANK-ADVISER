// 하나은행 서식 데이터 자동 생성 유틸리티
// complete_hana_forms.json을 기반으로 424개의 서식 설정을 자동 생성

import completeHanaForms from '../data/complete_hana_forms.json';

// 서식 카테고리별 기본 템플릿
const categoryTemplates = {
  "대출": {
    headerColor: "#666666",
    titleSize: "16pt",
    sharedFields: ["customer_name", "resident_number", "phone_number", "address"],
    defaultSections: [
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
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "resident_number", config: { type: "text", placeholder: "000000-0000000" } }
                ]
              },
              {
                cells: [
                  { type: "label", content: "연락처", style: { width: '100px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "010-1234-5678" }, style: { width: '200px' } },
                  { type: "label", content: "주소", style: { width: '100px' } },
                  { type: "field", fieldId: "address", config: { type: "text", placeholder: "고객 주소를 입력해주세요" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "예금": {
    headerColor: "#0066cc",
    titleSize: "18pt",
    sharedFields: ["customer_name", "resident_number", "phone_number", "address"],
    defaultSections: [
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
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "resident_number", config: { type: "text", placeholder: "000000-0000000" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "외환": {
    headerColor: "#28a745",
    titleSize: "16pt",
    sharedFields: ["customer_name", "phone_number"],
    defaultSections: [
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
                  { type: "label", content: "연락처", style: { width: '100px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "010-1234-5678" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "퇴직연금": {
    headerColor: "#fd7e14",
    titleSize: "16pt",
    sharedFields: ["customer_name", "resident_number"],
    defaultSections: [
      {
        id: "customer_info",
        title: "가입자 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "가입자명", style: { width: '100px' } },
                  { type: "field", fieldId: "customer_name", config: { type: "text", placeholder: "가입자명을 입력해주세요" }, style: { width: '200px' } },
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "resident_number", config: { type: "text", placeholder: "000000-0000000" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "전자금융": {
    headerColor: "#6f42c1",
    titleSize: "16pt",
    sharedFields: ["customer_name", "phone_number"],
    defaultSections: [
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
                  { type: "label", content: "연락처", style: { width: '100px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "010-1234-5678" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "파생상품": {
    headerColor: "#dc3545",
    titleSize: "16pt",
    sharedFields: ["customer_name", "resident_number"],
    defaultSections: [
      {
        id: "customer_info",
        title: "거래자 정보",
        content: [
          {
            type: "table",
            rows: [
              {
                cells: [
                  { type: "label", content: "거래자명", style: { width: '100px' } },
                  { type: "field", fieldId: "customer_name", config: { type: "text", placeholder: "거래자명을 입력해주세요" }, style: { width: '200px' } },
                  { type: "label", content: "주민등록번호", style: { width: '100px' } },
                  { type: "field", fieldId: "resident_number", config: { type: "text", placeholder: "000000-0000000" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "기타": {
    headerColor: "#6c757d",
    titleSize: "16pt",
    sharedFields: ["customer_name", "phone_number"],
    defaultSections: [
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
                  { type: "field", fieldId: "customer_name", config: { type: "text", placeholder: "신청인 성명을 입력해주세요" }, style: { width: '200px' } },
                  { type: "label", content: "연락처", style: { width: '100px' } },
                  { type: "field", fieldId: "phone_number", config: { type: "tel", placeholder: "010-1234-5678" } }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

// 서식 ID 생성 함수
const generateFormId = (title, category) => {
  const baseId = title
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  return `${category.toLowerCase()}_${baseId}`;
};

// 서식별 특수 필드 생성
const generateSpecialFields = (formTitle, category) => {
  const specialFields = [];
  
  // 서식 제목에 따른 특수 필드 추가
  if (formTitle.includes('자동이체')) {
    specialFields.push({
      id: "transfer_info",
      title: "이체 정보",
      content: [
        {
          type: "table",
          rows: [
            {
              cells: [
                { type: "label", content: "출금계좌", style: { width: '100px' } },
                { type: "field", fieldId: "withdrawal_account", config: { type: "text", placeholder: "출금계좌번호를 입력해주세요" }, style: { width: '200px' } },
                { type: "label", content: "입금계좌", style: { width: '100px' } },
                { type: "field", fieldId: "deposit_account", config: { type: "text", placeholder: "입금계좌번호를 입력해주세요" } }
              ]
            },
            {
              cells: [
                { type: "label", content: "이체금액", style: { width: '100px' } },
                { type: "field", fieldId: "transfer_amount", config: { type: "number", placeholder: "이체금액을 입력해주세요" }, style: { width: '200px' } },
                { type: "label", content: "이체일자", style: { width: '100px' } },
                { type: "field", fieldId: "transfer_date", config: { type: "number", placeholder: "매월 일자" } }
              ]
            }
          ]
        }
      ]
    });
  }
  
  if (formTitle.includes('증명서')) {
    specialFields.push({
      id: "certificate_info",
      title: "증명서 발급 정보",
      content: [
        {
          type: "table",
          rows: [
            {
              cells: [
                { type: "label", content: "계좌번호", style: { width: '100px' } },
                { type: "field", fieldId: "account_number", config: { type: "text", placeholder: "계좌번호를 입력해주세요" }, style: { width: '200px' } },
                { type: "label", content: "발급매수", style: { width: '100px' } },
                { type: "field", fieldId: "copy_count", config: { type: "number", placeholder: "1" } }
              ]
            },
            {
              cells: [
                { type: "label", content: "발급목적", style: { width: '100px' } },
                { type: "field", fieldId: "certificate_purpose", config: { type: "text", placeholder: "발급목적을 입력해주세요" }, colSpan: 3 }
              ]
            }
          ]
        }
      ]
    });
  }
  
  if (formTitle.includes('대출')) {
    specialFields.push({
      id: "loan_info",
      title: "대출 정보",
      content: [
        {
          type: "table",
          rows: [
            {
              cells: [
                { type: "label", content: "대출금액", style: { width: '100px' } },
                { type: "field", fieldId: "loan_amount", config: { type: "number", placeholder: "대출금액을 입력해주세요" }, style: { width: '200px' } },
                { type: "label", content: "대출기간", style: { width: '100px' } },
                { type: "field", fieldId: "loan_period", config: { type: "text", placeholder: "대출기간을 입력해주세요" } }
              ]
            },
            {
              cells: [
                { type: "label", content: "대출목적", style: { width: '100px' } },
                { type: "field", fieldId: "loan_purpose", config: { type: "text", placeholder: "대출목적을 입력해주세요" }, colSpan: 3 }
              ]
            }
          ]
        }
      ]
    });
  }
  
  return specialFields;
};

// 서명 섹션 생성
const generateSignatureSection = () => ({
  id: "signature_section",
  title: "서명 및 날짜",
  content: [
    {
      type: "table",
      rows: [
        {
          cells: [
            { type: "label", content: "신청인 서명", style: { width: '100px' } },
            { type: "field", fieldId: "customer_signature", config: { type: "signature" }, style: { width: '200px' } },
            { type: "label", content: "신청일자", style: { width: '100px' } },
            { type: "field", fieldId: "application_date", config: { type: "date" } }
          ]
        }
      ]
    }
  ]
});

// 서식 설정 생성 함수
const generateFormConfig = (formData) => {
  const { category, title, url, filename } = formData;
  
  // 카테고리별 기본 템플릿 가져오기
  const template = categoryTemplates[category] || categoryTemplates["기타"];
  
  // 서식 ID 생성
  const formId = generateFormId(title, category);
  
  // 특수 필드 생성
  const specialFields = generateSpecialFields(title, category);
  
  // 서명 섹션 추가
  const signatureSection = generateSignatureSection();
  
  // 모든 섹션 결합
  const allSections = [
    ...template.defaultSections,
    ...specialFields,
    signatureSection
  ];
  
  return {
    id: formId,
    title: title,
    description: `${category} 관련 서식입니다.`,
    category: category,
    headerColor: template.headerColor,
    titleSize: template.titleSize,
    sharedFields: template.sharedFields,
    sections: allSections,
    footer: {
      left: "하나은행 본점\n서울특별시 중구 을지로 35"
    },
    metadata: {
      originalUrl: url,
      originalFilename: filename,
      generatedAt: new Date().toISOString()
    }
  };
};

// 모든 서식 설정 생성
export const generateAllFormConfigs = () => {
  const formConfigs = {};
  
  completeHanaForms.forms.forEach(form => {
    const config = generateFormConfig(form);
    formConfigs[config.id] = config;
  });
  
  return formConfigs;
};

// 카테고리별 서식 통계 생성
export const generateFormStatistics = () => {
  const stats = {};
  
  completeHanaForms.forms.forEach(form => {
    if (!stats[form.category]) {
      stats[form.category] = 0;
    }
    stats[form.category]++;
  });
  
  return stats;
};

// 서식 검색 및 필터링 함수
export const searchGeneratedForms = (query, category = null) => {
  const allConfigs = generateAllFormConfigs();
  const forms = Object.values(allConfigs);
  
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

// 서식 완성도 계산 (기존과 동일)
export const calculateFormCompletion = (formId, formData) => {
  const allConfigs = generateAllFormConfigs();
  const formConfig = allConfigs[formId];
  if (!formConfig) return 0;
  
  let totalFields = 0;
  let completedFields = 0;
  
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

// 개발용: 일부 서식만 생성 (테스트용)
export const generateSampleFormConfigs = (count = 10) => {
  const formConfigs = {};
  const sampleForms = completeHanaForms.forms.slice(0, count);
  
  sampleForms.forEach(form => {
    const config = generateFormConfig(form);
    formConfigs[config.id] = config;
  });
  
  return formConfigs;
};

export default {
  generateAllFormConfigs,
  generateSampleFormConfigs,
  generateFormStatistics,
  searchGeneratedForms,
  calculateFormCompletion
};
