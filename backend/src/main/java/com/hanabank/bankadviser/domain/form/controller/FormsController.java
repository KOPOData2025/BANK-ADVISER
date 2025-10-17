package com.hanabank.bankadviser.domain.form.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/forms")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class FormsController {

    @GetMapping("/test")
    public String test() {
        log.info("🎯 FormController /test 엔드포인트 호출됨!");
        return "FormController 테스트 성공! 🎉";
    }

    @GetMapping("/byProductId/{productId}")
    public ResponseEntity<ApiResponse<?>> getFormsByProductId(@PathVariable String productId) {
        try {
            log.info("📋 상품 ID별 서식 조회 요청 - productId: {}", productId);
            
            // 4개의 서식 데이터 반환
            List<Object> forms = List.of(
                createConsentForm(),
                createApplicationForm(),
                createElectronicFinanceForm(),
                createFinancialPurposeForm()
            );
            
            log.info("✅ 4개 서식 반환 완료");
            return ResponseEntity.ok(ApiResponse.success("상품 ID별 서식 조회 성공", forms));
        } catch (Exception e) {
            log.error("❌ 상품 ID별 서식 조회 실패: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success("상품 ID별 서식 조회 성공 (기본)", List.of("기본 서식")));
        }
    }

    private Map<String, Object> createFieldMap(String id, String name, String type, boolean required) {
        Map<String, Object> field = new HashMap<>();
        field.put("id", id);
        field.put("name", name);
        field.put("type", type);
        field.put("required", required);
        return field;
    }

    private Map<String, Object> createConsentForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("customer_name", "고객명", "text", true),
            createFieldMap("customer_id", "주민등록번호", "text", true),
            createFieldMap("phone", "연락처", "text", true),
            createFieldMap("address", "주소", "text", true),
            createFieldMap("consent_agree", "개인정보 수집·이용 동의", "checkbox", true),
            createFieldMap("consentDate", "동의일자", "date", true),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "consent_form");
        form.put("formName", "개인정보 수집·이용 동의서");
        form.put("formType", "consent");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/consent_form.pdf");
        form.put("formSchema", formSchema);
        return form;
    }

    private Map<String, Object> createApplicationForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("account_type", "계좌유형", "select", true),
            createFieldMap("deposit_amount", "예금금액", "number", true),
            createFieldMap("maturity_date", "만기일", "date", true),
            createFieldMap("auto_renewal", "자동재예치", "checkbox", false)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "application_form");
        form.put("formName", "은행거래신청서");
        form.put("formType", "application");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/application_form.pdf");
        form.put("formSchema", formSchema);
        return form;
    }

    private Map<String, Object> createElectronicFinanceForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("applicationType", "신청구분", "radio", true),
            createFieldMap("serviceType", "서비스 유형", "checkbox", true),
            createFieldMap("customerName", "성명", "text", true),
            createFieldMap("customerAddress", "주소", "text", true),
            createFieldMap("customerEmail", "E-Mail주소", "email", false),
            createFieldMap("userId", "이용자 ID", "text", true),
            createFieldMap("dailyTransferLimit", "1일이체한도", "text", true),
            createFieldMap("singleTransferLimit", "1회이체한도", "text", true),
            createFieldMap("applicationDate", "신청일자", "date", true),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "electronic_finance_form");
        form.put("formName", "개인 전자금융서비스 신청서");
        form.put("formType", "electronic_finance");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/electronic_finance_form.pdf");
        form.put("formSchema", formSchema);
        return form;
    }

    private Map<String, Object> createFinancialPurposeForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("customerName", "고객명", "text", true),
            createFieldMap("customerId", "주민등록번호", "text", true),
            createFieldMap("transactionPurpose", "거래목적", "select", true),
            createFieldMap("expectedAmount", "예상거래금액", "number", true),
            createFieldMap("fundSource", "자금출처", "select", true),
            createFieldMap("riskTolerance", "위험성향", "radio", true),
            createFieldMap("investmentPeriod", "투자기간", "select", true),
            createFieldMap("confirmationDate", "확인일자", "date", true),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "financial_purpose_form");
        form.put("formName", "금융거래목적확인서");
        form.put("formType", "financial_purpose");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/financial_purpose_form.pdf");
        form.put("formSchema", formSchema);
        return form;
    }
}