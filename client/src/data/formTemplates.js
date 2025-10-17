// 실제 하나은행 서식 기반 템플릿들
export const realHanaBankForms = {
  // 자동이체 신청서 (이미지 기반)
  autoTransfer: {
    title: "자동이체 신청서",
    description: "본인은 하나은행의 해당 자동이체 약관에 동의하여 다음과 같이 신청합니다.",
    type: "pdf",
    pdfUrl: null,
    sections: [
      {
        title: "� 이체일자 및 신청일",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "transfer_date",
                type: "number",
                label: "이체일",
                required: true,
                placeholder: "20",
                flex: 1
              },
              {
                id: "transfer_unit",
                type: "select",
                label: "단위",
                required: true,
                options: [
                  { value: "day", label: "일" },
                  { value: "month", label: "월" }
                ],
                flex: 1
              },
              {
                id: "signature_date",
                type: "date",
                label: "신청일자",
                required: true,
                flex: 2
              }
            ]
          }
        ]
      },
      {
        title: "👤 예금주 정보",
        fields: [
          {
            id: "account_holder_name",
            type: "text",
            label: "예금주 성명",
            required: true,
            placeholder: "홍길동"
          },
          {
            type: "row",
            fields: [
              {
                id: "account_holder_birth",
                type: "text",
                label: "생년월일 (6자리)",
                required: true,
                placeholder: "831225",
                flex: 1
              },
              {
                id: "phone_number",
                type: "tel", 
                label: "연락처",
                required: true,
                placeholder: "010-1234-5678",
                flex: 1
              }
            ]
          },
          {
            id: "withdrawal_account",
            type: "text",
            label: "출금계좌번호",
            required: true,
            placeholder: "※ 작성하실때는 입금할 거래은행의 지점번호까지 기재"
          }
        ]
      },
      {
        title: "🏦 계좌 정보",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "bank_name",
                type: "text",
                label: "은행명",
                required: true,
                placeholder: "하나",
                flex: 1
              },
              {
                id: "account_number",
                type: "text",
                label: "계좌번호",
                required: true,
                placeholder: "123-456789-12345",
                flex: 2
              }
            ]
          }
        ]
      },
      {
        title: "💳 자동이체 유형",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "transfer_type_rental",
                type: "select",
                label: "계약자 자동이체",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              },
              {
                id: "transfer_type_tax",
                type: "select", 
                label: "타행 자동이체",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "transfer_type_other",
                type: "select",
                label: "남북차 자동이체",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              },
              {
                id: "transfer_type_pension",
                type: "select",
                label: "연차 자동이체",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "application_type",
                type: "select",
                label: "신청구분",
                required: true,
                options: [
                  { value: "new", label: "신규" },
                  { value: "change", label: "변경" }
                ],
                flex: 1
              },
              {
                id: "sms_notification",
                type: "select",
                label: "SMS 통지",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "💰 입금 정보",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "deposit_bank",
                type: "text",
                label: "입금은행명",
                required: true,
                placeholder: "하나은행",
                flex: 1
              },
              {
                id: "deposit_account",
                type: "text", 
                label: "입금계좌번호",
                required: true,
                placeholder: "123-456789-12345",
                flex: 2
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "deposit_holder",
                type: "text",
                label: "예금주",
                required: true,
                placeholder: "김하나",
                flex: 1
              },
              {
                id: "deposit_amount",
                type: "number",
                label: "이체금액 (원)",
                required: true,
                placeholder: "100000",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "transfer_period",
                type: "text",
                label: "이체기간",
                required: true,
                placeholder: "2024.01.01 ~ 2024.12.31",
                flex: 1
              },
              {
                id: "transfer_schedule",
                type: "text",
                label: "이체일정보",
                required: true,
                placeholder: "매월 20일",
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "📋 기타 자동이체",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "other_transfer_type",
                type: "select",
                label: "신청구분",
                required: false,
                options: [
                  { value: "new", label: "신규" },
                  { value: "change", label: "변경" },
                  { value: "cancel", label: "해지" }
                ],
                flex: 1
              },
              {
                id: "other_transfer_company",
                type: "text",
                label: "수납기업",
                required: false,
                placeholder: "한국전력공사",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "customer_number",
                type: "text",
                label: "고객번호",
                required: false,
                placeholder: "전력, 가스, 수도 고객번호",
                flex: 1
              },
              {
                id: "billing_number",
                type: "text",
                label: "청구번호/카드번호",
                required: false,
                placeholder: "",
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "✍️ 서명 및 확인",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "customer_signature",
                type: "signature",
                label: "고객 서명",
                required: true,
                flex: 1
              },
              {
                id: "employee_signature", 
                type: "signature",
                label: "직원 확인",
                required: false,
                flex: 1
              }
            ]
          }
        ]
      }
    ]
  },

  // 은행거래신청서 (실제 서식 기반)
  bankTransaction: {
    title: "은행거래신청서",
    description: "하나은행과의 거래를 위한 기본 정보를 기재해주세요.",
    type: "pdf",
    pdfUrl: null,
    sections: [
      {
        title: "👤 개인정보",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "customer_name_korean",
                type: "text",
                label: "성명(한글)",
                required: true,
                placeholder: "홍길동",
                flex: 1
              },
              {
                id: "customer_name_english",
                type: "text",
                label: "성명(영문)",
                required: false,
                placeholder: "HONG GIL DONG",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "resident_number",
                type: "text",
                label: "주민등록번호",
                required: true,
                placeholder: "123456-1234567",
                flex: 1
              },
              {
                id: "nationality",
                type: "select",
                label: "국적",
                required: true,
                options: [
                  { value: "korean", label: "대한민국" },
                  { value: "other", label: "기타" }
                ],
                flex: 1
              }
            ]
          },
          {
            id: "address",
            type: "text",
            label: "주소",
            required: true,
            placeholder: "서울시 중구 을지로 35 (을지로1가)"
          },
          {
            type: "row",
            fields: [
              {
                id: "phone_home",
                type: "tel",
                label: "전화번호(자택)",
                required: false,
                placeholder: "02-123-4567",
                flex: 1
              },
              {
                id: "phone_mobile",
                type: "tel",
                label: "휴대폰번호",
                required: true,
                placeholder: "010-1234-5678",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "email",
                type: "email",
                label: "이메일",
                required: false,
                placeholder: "example@email.com",
                flex: 1
              },
              {
                id: "occupation",
                type: "text",
                label: "직업",
                required: true,
                placeholder: "회사원",
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "🏦 계좌개설 정보",
        fields: [
          {
            id: "account_type",
            type: "select",
            label: "개설할 계좌종류",
            required: true,
            options: [
              { value: "savings", label: "하나원큐통장" },
              { value: "check", label: "자유수표계좌" },
              { value: "term", label: "정기예금" },
              { value: "installment", label: "정기적금" }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "initial_deposit_amount",
                type: "number",
                label: "최초입금액",
                required: true,
                placeholder: "100000",
                flex: 1
              },
              {
                id: "account_password",
                type: "text",
                label: "계좌비밀번호(4자리)",
                required: true,
                placeholder: "1234",
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "� 부가서비스 신청",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "internet_banking",
                type: "select",
                label: "인터넷뱅킹",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              },
              {
                id: "mobile_banking",
                type: "select",
                label: "모바일뱅킹",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "sms_service",
                type: "select",
                label: "SMS 서비스",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              },
              {
                id: "debit_card",
                type: "select",
                label: "체크카드 발급",
                required: true,
                options: [
                  { value: "apply", label: "신청" },
                  { value: "not_apply", label: "신청안함" }
                ],
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "✍️ 서명 및 날짜",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "customer_signature",
                type: "signature",
                label: "고객 서명",
                required: true,
                flex: 1
              },
              {
                id: "application_date",
                type: "date",
                label: "신청일자",
                required: true,
                flex: 1
              }
            ]
          }
        ]
      }
    ]
  },

  // 예금잔액증명 의뢰서
  balanceCertificate: {
    title: "예금(신탁)잔액증명 의뢰서",
    description: "예금잔액증명서 발급을 위한 신청서입니다.",
    type: "pdf",
    pdfUrl: null,
    sections: [
      {
        title: "🆔 신청인 정보",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "applicant_name",
                type: "text",
                label: "신청인 성명",
                required: true,
                placeholder: "홍길동",
                flex: 1
              },
              {
                id: "applicant_id",
                type: "text",
                label: "주민등록번호",
                required: true,
                placeholder: "123456-1234567",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "applicant_phone",
                type: "tel",
                label: "연락처",
                required: true,
                placeholder: "010-1234-5678",
                flex: 1
              },
              {
                id: "relationship",
                type: "select",
                label: "예금주와의 관계",
                required: true,
                options: [
                  { value: "self", label: "본인" },
                  { value: "spouse", label: "배우자" },
                  { value: "parent", label: "부모" },
                  { value: "child", label: "자녀" },
                  { value: "other", label: "기타" }
                ],
                flex: 1
              }
            ]
          }
        ]
      },
      {
        title: "� 증명서 발급 정보",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "account_number",
                type: "text",
                label: "계좌번호",
                required: true,
                placeholder: "123-456789-12345",
                flex: 1
              },
              {
                id: "account_holder",
                type: "text",
                label: "예금주명",
                required: true,
                placeholder: "홍길동",
                flex: 1
              }
            ]
          },
          {
            type: "row",
            fields: [
              {
                id: "certificate_type",
                type: "select",
                label: "증명서 종류",
                required: true,
                options: [
                  { value: "balance", label: "잔액증명서" },
                  { value: "transaction", label: "거래내역증명서" },
                  { value: "account_opening", label: "계좌개설증명서" }
                ],
                flex: 1
              },
              {
                id: "copy_count",
                type: "number",
                label: "발급매수",
                required: true,
                placeholder: "1",
                flex: 1
              }
            ]
          },
          {
            id: "certificate_purpose",
            type: "text",
            label: "증명서 발급목적",
            required: true,
            placeholder: "제출처 및 용도를 구체적으로 기재"
          }
        ]
      },
      {
        title: "✍️ 서명 및 날짜",
        fields: [
          {
            type: "row",
            fields: [
              {
                id: "applicant_signature",
                type: "signature",
                label: "신청인 서명",
                required: true,
                flex: 1
              },
              {
                id: "application_date",
                type: "date",
                label: "신청일자",
                required: true,
                flex: 1
              }
            ]
          }
        ]
      }
    ]
  }
};

// 기존 템플릿을 실제 하나은행 템플릿으로 업데이트
export const formTemplates = {
  loan: realHanaBankForms.autoTransfer, // 자동이체 신청서
  account: realHanaBankForms.bankTransaction, // 은행거래신청서  
  card: realHanaBankForms.balanceCertificate // 예금잔액증명 의뢰서
};
