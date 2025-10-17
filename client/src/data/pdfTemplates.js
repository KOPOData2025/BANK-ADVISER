// PDF 템플릿 매핑 시스템
// 각 서식별로 정확한 레이아웃과 스타일을 정의

export const pdfTemplates = {
  // 외환파생상품거래 헤지 수요 현황 및 거래 실행에 따른 확인서
  "5-09-0101": {
    title: "외환파생상품거래 헤지 수요 현황 및 거래 실행에 따른 확인서",
    layout: {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      sections: [
        {
          type: "header",
          content: {
            bankInfo: "주식회사 하나은행",
            branchField: { type: "text", placeholder: "지점/부", width: 200 },
            reportTitle: "년 외환파생상품거래 헤지 수요 현황",
            yearField: { type: "text", placeholder: "", width: 60 },
            unit: "(단위 : 천미불)"
          },
          style: {
            fontSize: 12,
            fontWeight: "normal",
            textAlign: "left"
          }
        },
        {
          type: "table",
          title: "헤지 수요 현황",
          structure: {
            columns: [
              { name: "구분", width: "40%", align: "left" },
              { name: "금액", width: "40%", align: "center", subColumns: ["수출(투자포함)", "수입(조달포함)"] },
              { name: "비고", width: "20%", align: "center" }
            ],
            rows: [
              {
                type: "header",
                cells: [
                  { content: "구분", colspan: 1 },
                  { content: "금액", colspan: 2 },
                  { content: "비고", colspan: 1 }
                ]
              },
              {
                type: "subheader",
                cells: [
                  { content: "(해당 □란에 체크)", colspan: 1 },
                  { content: "수출(투자포함)", colspan: 1 },
                  { content: "수입(조달포함)", colspan: 1 },
                  { content: "", colspan: 1 }
                ]
              },
              {
                type: "group",
                title: "택일",
                rows: [
                  {
                    cells: [
                      { content: "□ 과거 수출입 실적기준", type: "checkbox" },
                      { content: "", type: "number", placeholder: "금액 입력" },
                      { content: "", type: "number", placeholder: "금액 입력" },
                      { content: "", type: "text", placeholder: "비고" }
                    ]
                  },
                  {
                    cells: [
                      { content: "□ 개별 계약건별 기준", type: "checkbox" },
                      { content: "", type: "number", placeholder: "금액 입력" },
                      { content: "", type: "number", placeholder: "금액 입력" },
                      { content: "", type: "text", placeholder: "비고" }
                    ]
                  }
                ]
              },
              {
                cells: [
                  { content: "□ 기타 (향후 예상 경상/재무거래 등)", type: "checkbox" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              },
              {
                type: "total",
                cells: [
                  { content: "헤지대상 금액 합계\n(헤지비율 분모에 해당)", type: "text", bold: true },
                  { content: "", type: "number", placeholder: "합계", readonly: true },
                  { content: "", type: "number", placeholder: "합계", readonly: true },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              }
            ]
          }
        },
        {
          type: "table",
          title: "기 체결 외환파생상품 거래금액",
          structure: {
            columns: [
              { name: "기 체결 외환파생상품 거래금액", width: "40%", align: "left" },
              { name: "금액", width: "40%", align: "center", subColumns: ["수출", "수입"] },
              { name: "비고", width: "20%", align: "center" }
            ],
            rows: [
              {
                type: "header",
                cells: [
                  { content: "기 체결 외환파생상품 거래금액", colspan: 1 },
                  { content: "금액", colspan: 2 },
                  { content: "비고", colspan: 1 }
                ]
              },
              {
                cells: [
                  { content: "통화선도\n(외환스왑, NDF 포함)", type: "text" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              },
              {
                cells: [
                  { content: "통화옵션", type: "text" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              },
              {
                cells: [
                  { content: "통화스왑", type: "text" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              },
              {
                cells: [
                  { content: "환변동보험 및 기타(", type: "text" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "number", placeholder: "금액 입력" },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              },
              {
                type: "total",
                cells: [
                  { content: "기헤지거래 금액 합계\n(헤지비율 분자에 해당)", type: "text", bold: true },
                  { content: "", type: "number", placeholder: "합계", readonly: true },
                  { content: "", type: "number", placeholder: "합계", readonly: true },
                  { content: "", type: "text", placeholder: "비고" }
                ]
              }
            ]
          }
        },
        {
          type: "instructions",
          title: "※ 작성요령",
          content: [
            "첨부서류를 제출하여야 하나, 확인 가능한 자료가 있는 경우에는 제출을 생략할 수 있습니다.",
            "기타 통화 거래는 원화 표시만 허용하며, 첫 거래일 환율로 미불 환산하여 기재합니다.",
            "연간 한도 기간은 1월~12월이며, 변경사항 발생 시 재신청이 필요합니다."
          ]
        },
        {
          type: "footer",
          content: {
            documentId: "5-09-0101(2-1) (2025.08 개정)",
            retention: "(보존년한 : 완제일로부터 10년)",
            bankLogo: "하나은행"
          }
        }
      ]
    },
    style: {
      fontFamily: "Malgun Gothic, Arial, sans-serif",
      fontSize: 10,
      lineHeight: 1.4,
      tableBorder: "1px solid #000",
      cellPadding: "4px 6px",
      headerBackground: "#f0f0f0",
      totalRowBackground: "#e8f4f8"
    }
  },

  // 개인신용정보 수집이용동의서 (비여신금융거래)
  "3-08-1294": {
    title: "[필수] 개인(신용)정보 수집 · 이용 동의서 (비여신 금융거래)",
    layout: {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      sections: [
        {
          type: "header",
          content: {
            title: "[필수] 개인(신용)정보 수집 · 이용 동의서",
            subtitle: "(비여신 금융거래)",
            bankInfo: "주식회사 하나은행"
          },
          style: {
            fontSize: 14,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20
          }
        },
        {
          type: "consent",
          title: "개인(신용)정보 수집·이용 동의",
          content: [
            "귀하는 개인(신용)정보 수집·이용에 관한 동의를 거부할 수 있습니다.",
            "다만, 동의를 거부하시는 경우에는 비여신 금융거래 서비스 이용이 제한됩니다."
          ],
          fields: [
            {
              name: "customerName",
              label: "고객명",
              type: "text",
              placeholder: "고객명을 입력하세요",
              required: true
            },
            {
              name: "residentNumber",
              label: "주민등록번호",
              type: "text",
              placeholder: "000000-0000000",
              required: true
            },
            {
              name: "phoneNumber",
              label: "연락처",
              type: "tel",
              placeholder: "010-0000-0000",
              required: true
            }
          ]
        },
        {
          type: "checkbox",
          title: "수집·이용 목적",
          items: [
            "비여신 금융거래 서비스 제공",
            "고객 상담 및 민원처리",
            "법령상 의무이행",
            "금융사고 조사 및 분쟁해결"
          ]
        },
        {
          type: "checkbox",
          title: "수집·이용 항목",
          items: [
            "개인식별정보 (성명, 주민등록번호, 연락처 등)",
            "거래정보 (계좌번호, 거래내역 등)",
            "신용정보 (신용등급, 연체정보 등)"
          ]
        },
        {
          type: "signature",
          title: "서명 및 날짜",
          fields: [
            {
              name: "signature",
              label: "서명",
              type: "signature",
              placeholder: "클릭하여 서명"
            },
            {
              name: "date",
              label: "날짜",
              type: "date",
              placeholder: "YYYY-MM-DD"
            }
          ]
        }
      ]
    },
    style: {
      fontFamily: "Malgun Gothic, Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.5,
      sectionMargin: 15,
      fieldMargin: 10
    }
  },

  // 대출계약 철회신청서 제거됨
  },
sections: [
        {
          type: "header",
          content: {
            title: "대출계약 철회신청서",
            bankInfo: "주식회사 하나은행"
          },
          style: {
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 30
          }
        },
        {
          type: "customer_info",
          title: "신청인 정보",
          fields: [
            {
              name: "customerName",
              label: "신청인 성명",
              type: "text",
              placeholder: "신청인 성명을 입력하세요",
              required: true
            },
            {
              name: "residentNumber",
              label: "주민등록번호",
              type: "text",
              placeholder: "000000-0000000",
              required: true
            },
            {
              name: "phoneNumber",
              label: "연락처",
              type: "tel",
              placeholder: "010-0000-0000",
              required: true
            },
            {
              name: "address",
              label: "주소",
              type: "text",
              placeholder: "주소를 입력하세요",
              required: true
            }
          ]
        },
        {
          type: "loan_info",
          title: "대출 정보",
          fields: [
            {
              name: "loanType",
              label: "대출 종류",
              type: "select",
              options: ["주택담보대출", "신용대출", "사업자대출", "기타"],
              required: true
            },
            {
              name: "loanAmount",
              label: "대출금액",
              type: "number",
              placeholder: "대출금액을 입력하세요",
              required: true
            },
            {
              name: "contractDate",
              label: "계약일자",
              type: "date",
              placeholder: "YYYY-MM-DD",
              required: true
            },
            {
              name: "withdrawalReason",
              label: "철회 사유",
              type: "textarea",
              placeholder: "철회 사유를 상세히 입력하세요",
              required: true
            }
          ]
        },
        {
          type: "signature",
          title: "서명 및 날짜",
          fields: [
            {
              name: "signature",
              label: "신청인 서명",
              type: "signature",
              placeholder: "클릭하여 서명"
            },
            {
              name: "applicationDate",
              label: "신청일자",
              type: "date",
              placeholder: "YYYY-MM-DD"
            }
          ]
        }
      ]
    },
    style: {
      fontFamily: "Malgun Gothic, Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.5,
      sectionMargin: 20,
      fieldMargin: 12
    }
  },

  // 주택도시기금 대출 신청서 제거됨
  },
sections: [
        {
          type: "header",
          content: {
            title: "주택도시기금 대출 신청서",
            subtitle: "(가계용)",
            bankInfo: "주식회사 하나은행"
          },
          style: {
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 30
          }
        },
        {
          type: "applicant_info",
          title: "신청인 정보",
          fields: [
            {
              name: "applicantName",
              label: "신청인 성명",
              type: "text",
              placeholder: "신청인 성명을 입력하세요",
              required: true
            },
            {
              name: "applicantResidentNumber",
              label: "주민등록번호",
              type: "text",
              placeholder: "000000-0000000",
              required: true
            },
            {
              name: "applicantPhone",
              label: "연락처",
              type: "tel",
              placeholder: "010-0000-0000",
              required: true
            },
            {
              name: "applicantAddress",
              label: "주소",
              type: "text",
              placeholder: "주소를 입력하세요",
              required: true
            }
          ]
        },
        {
          type: "house_info",
          title: "주택 정보",
          fields: [
            {
              name: "houseType",
              label: "주택 종류",
              type: "select",
              options: ["아파트", "오피스텔", "단독주택", "연립주택", "다세대주택"],
              required: true
            },
            {
              name: "houseAddress",
              label: "주택 주소",
              type: "text",
              placeholder: "주택 주소를 입력하세요",
              required: true
            },
            {
              name: "houseSize",
              label: "주택 면적",
              type: "number",
              placeholder: "면적을 입력하세요 (㎡)",
              required: true
            },
            {
              name: "houseValue",
              label: "주택 가격",
              type: "number",
              placeholder: "주택 가격을 입력하세요",
              required: true
            }
          ]
        },
        {
          type: "loan_info",
          title: "대출 정보",
          fields: [
            {
              name: "loanAmount",
              label: "대출 신청 금액",
              type: "number",
              placeholder: "대출 신청 금액을 입력하세요",
              required: true
            },
            {
              name: "loanPurpose",
              label: "대출 목적",
              type: "select",
              options: ["주택구입", "주택개량", "주택구입자금", "기타"],
              required: true
            },
            {
              name: "repaymentPeriod",
              label: "상환 기간",
              type: "number",
              placeholder: "상환 기간을 입력하세요 (년)",
              required: true
            }
          ]
        },
        {
          type: "signature",
          title: "서명 및 날짜",
          fields: [
            {
              name: "signature",
              label: "신청인 서명",
              type: "signature",
              placeholder: "클릭하여 서명"
            },
            {
              name: "applicationDate",
              label: "신청일자",
              type: "date",
              placeholder: "YYYY-MM-DD"
            }
          ]
        }
      ]
    },
    style: {
      fontFamily: "Malgun Gothic, Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.5,
      sectionMargin: 20,
      fieldMargin: 12
    }
  },

  // 퇴직연금 거래신청서(개인형IRP)
  "5-14-0020": {
    title: "퇴직연금 거래신청서(개인형IRP)",
    layout: {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      sections: [
        {
          type: "header",
          content: {
            title: "퇴직연금 거래신청서",
            subtitle: "(개인형IRP)",
            bankInfo: "주식회사 하나은행"
          },
          style: {
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 30
          }
        },
        {
          type: "member_info",
          title: "가입자 정보",
          fields: [
            {
              name: "memberName",
              label: "가입자 성명",
              type: "text",
              placeholder: "가입자 성명을 입력하세요",
              required: true
            },
            {
              name: "memberResidentNumber",
              label: "주민등록번호",
              type: "text",
              placeholder: "000000-0000000",
              required: true
            },
            {
              name: "memberPhone",
              label: "연락처",
              type: "tel",
              placeholder: "010-0000-0000",
              required: true
            },
            {
              name: "memberAddress",
              label: "주소",
              type: "text",
              placeholder: "주소를 입력하세요",
              required: true
            }
          ]
        },
        {
          type: "pension_info",
          title: "퇴직연금 정보",
          fields: [
            {
              name: "pensionType",
              label: "연금 종류",
              type: "select",
              options: ["개인형IRP", "기업형IRP", "DC형", "DB형"],
              required: true
            },
            {
              name: "contributionAmount",
              label: "납입 금액",
              type: "number",
              placeholder: "월 납입 금액을 입력하세요",
              required: true
            },
            {
              name: "investmentMethod",
              label: "운용 방법",
              type: "select",
              options: ["자동운용", "수동운용", "혼합운용"],
              required: true
            }
          ]
        },
        {
          type: "signature",
          title: "서명 및 날짜",
          fields: [
            {
              name: "signature",
              label: "가입자 서명",
              type: "signature",
              placeholder: "클릭하여 서명"
            },
            {
              name: "applicationDate",
              label: "신청일자",
              type: "date",
              placeholder: "YYYY-MM-DD"
            }
          ]
        }
      ]
    },
    style: {
      fontFamily: "Malgun Gothic, Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.5,
      sectionMargin: 20,
      fieldMargin: 12
    }
  }
};

// 템플릿 매핑 함수
export const getTemplateByFilename = (filename) => {
  const key = filename.replace('.pdf', '');
  return pdfTemplates[key] || null;
};

// 템플릿 매핑 함수 (제목으로)
export const getTemplateByTitle = (title) => {
  for (const [key, template] of Object.entries(pdfTemplates)) {
    if (template.title === title) {
      return template;
    }
  }
  return null;
};

// 카테고리별 템플릿 그룹
export const templatesByCategory = {
  "파생상품": ["5-09-0101"],
  "기타": ["3-08-1294"],
  "대출": ["5-06-0681", "5-16-0177"],
  "퇴직연금": ["5-14-0020"],
  "외환": []
};
