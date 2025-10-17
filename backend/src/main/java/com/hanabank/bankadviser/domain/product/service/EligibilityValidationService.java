package com.hanabank.bankadviser.domain.product.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanabank.bankadviser.domain.customer.dto.CustomerDto;
import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 상품 자격 조건 검증 서비스
 */
// @Service
@Slf4j
public class EligibilityValidationService {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 고객이 특정 상품에 대한 자격이 있는지 검증
     */
    public EligibilityResult validateEligibility(CustomerDto customer, FinancialProduct product) {
        log.info("자격 조건 검증 시작 - 고객: {}, 상품: {}", customer.getName(), product.getProductName());
        
        EligibilityResult result = new EligibilityResult();
        result.setEligible(true);
        result.setReasons(new java.util.ArrayList<>());
        
        // 1. 나이 조건 검증
        if (!validateAgeCondition(customer, product, result)) {
            result.setEligible(false);
        }
        
        // 2. 소득 조건 검증
        if (!validateIncomeCondition(customer, product, result)) {
            result.setEligible(false);
        }
        
        // 3. 특별 조건 검증 (아이 보유, 군인 등)
        if (!validateSpecialConditions(customer, product, result)) {
            result.setEligible(false);
        }
        
        // 4. JSON 형태의 자격 조건 검증
        if (!validateJsonEligibilityConditions(customer, product, result)) {
            result.setEligible(false);
        }
        
        log.info("자격 조건 검증 완료 - 자격: {}, 이유: {}", result.isEligible(), result.getReasons());
        return result;
    }
    
    /**
     * 나이 조건 검증 (현재 DB 스키마에 age_min, age_max 컬럼이 없어서 비활성화)
     */
    private boolean validateAgeCondition(CustomerDto customer, FinancialProduct product, EligibilityResult result) {
        if (customer.getDateOfBirth() == null) {
            result.addReason("고객 생년월일 정보가 없습니다.");
            return false;
        }
        
        int age = Period.between(customer.getDateOfBirth(), LocalDate.now()).getYears();
        
        // DB에 age_min, age_max 컬럼이 없으므로 나이 검증 비활성화
        result.addReason(String.format("나이 조건 확인 완료 (%d세) - 상세 검증은 추후 구현 예정", age));
        return true;
    }
    
    /**
     * 소득 조건 검증
     */
    private boolean validateIncomeCondition(CustomerDto customer, FinancialProduct product, EligibilityResult result) {
        BigDecimal customerIncome = customer.getMonthlyIncome();
        if (customerIncome == null) {
            result.addReason("고객 소득 정보가 없습니다.");
            return false;
        }
        
        // DB에 income_min 컬럼이 없으므로 소득 검증 비활성화
        result.addReason(String.format("소득 조건 확인 완료 (%,.0f원) - 상세 검증은 추후 구현 예정", customerIncome));
        return true;
    }
    
    /**
     * 특별 조건 검증 (아이 보유, 군인 등)
     */
    private boolean validateSpecialConditions(CustomerDto customer, FinancialProduct product, EligibilityResult result) {
        // DB에 special_conditions 컬럼이 없으므로 특별 조건 검증 비활성화
        result.addReason("특별 조건 확인 완료 - 상세 검증은 추후 구현 예정");
        return true;
    }
    
    /**
     * 개별 특별 조건 검증
     */
    private boolean validateSpecialCondition(CustomerDto customer, String conditionType, Object conditionValue, EligibilityResult result) {
        switch (conditionType.toLowerCase()) {
            case "has_children":
                if (Boolean.TRUE.equals(conditionValue)) {
                    // 아이 보유 여부 확인 (실제로는 고객 정보에서 확인)
                    boolean hasChildren = checkIfCustomerHasChildren(customer);
                    if (!hasChildren) {
                        result.addReason("아이 보유 조건 미달");
                        return false;
                    }
                    result.addReason("아이 보유 조건 만족");
                }
                break;
                
            case "military_service":
                if (Boolean.TRUE.equals(conditionValue)) {
                    // 군인 여부 확인
                    boolean isMilitary = checkIfCustomerIsMilitary(customer);
                    if (!isMilitary) {
                        result.addReason("군인 자격 조건 미달");
                        return false;
                    }
                    result.addReason("군인 자격 조건 만족");
                }
                break;
                
            case "employment_status":
                if (conditionValue instanceof String) {
                    String requiredStatus = (String) conditionValue;
                    String customerStatus = getCustomerEmploymentStatus(customer);
                    if (!requiredStatus.equals(customerStatus)) {
                        result.addReason(String.format("고용 상태 조건 미달 (필요: %s, 현재: %s)", requiredStatus, customerStatus));
                        return false;
                    }
                    result.addReason(String.format("고용 상태 조건 만족 (%s)", customerStatus));
                }
                break;
                
            default:
                log.warn("알 수 없는 특별 조건: {}", conditionType);
        }
        
        return true;
    }
    
    /**
     * 단순 문자열 특별 조건 검증
     */
    private boolean validateSimpleSpecialCondition(CustomerDto customer, String specialConditions, EligibilityResult result) {
        String conditions = specialConditions.toLowerCase();
        
        if (conditions.contains("아이") || conditions.contains("자녀")) {
            boolean hasChildren = checkIfCustomerHasChildren(customer);
            if (!hasChildren) {
                result.addReason("아이 보유 조건 미달");
                return false;
            }
            result.addReason("아이 보유 조건 만족");
        }
        
        if (conditions.contains("군인") || conditions.contains("장병")) {
            boolean isMilitary = checkIfCustomerIsMilitary(customer);
            if (!isMilitary) {
                result.addReason("군인 자격 조건 미달");
                return false;
            }
            result.addReason("군인 자격 조건 만족");
        }
        
        return true;
    }
    
    /**
     * JSON 형태의 자격 조건 검증
     */
    private boolean validateJsonEligibilityConditions(CustomerDto customer, FinancialProduct product, EligibilityResult result) {
        // DB에 eligibility_conditions 컬럼이 없으므로 자격 조건 검증 비활성화
        result.addReason("자격 조건 확인 완료 - 상세 검증은 추후 구현 예정");
        return true;
    }
    
    /**
     * JSON 조건 검증
     */
    private boolean validateJsonCondition(CustomerDto customer, String conditionType, Object conditionValue, EligibilityResult result) {
        // JSON 형태의 복잡한 조건들을 처리
        // 예: {"credit_score": {"min": 700}, "existing_products": {"max": 3}}
        return true; // 기본적으로 통과
    }
    
    /**
     * 고객이 아이를 보유하고 있는지 확인 (시뮬레이션)
     */
    private boolean checkIfCustomerHasChildren(CustomerDto customer) {
        // 실제로는 고객 정보나 상담 이력에서 확인
        // 여기서는 시뮬레이션으로 처리
        String customerName = customer.getName();
        
        // 특정 고객들을 아이 보유자로 가정
        return customerName.contains("아이") || 
               customerName.contains("자녀") || 
               customer.getCustomerId().equals("CUST_30004867"); // 나미영 고객
    }
    
    /**
     * 고객이 군인인지 확인 (실제 데이터 기반)
     */
    private boolean checkIfCustomerIsMilitary(CustomerDto customer) {
        // 1. 고객이 이미 군인 전용 상품을 가입했는지 확인
        if (hasMilitaryProducts(customer)) {
            return true;
        }
        
        // 2. 상담 이력에서 군인 관련 키워드 확인
        if (hasMilitaryKeywordsInHistory(customer)) {
            return true;
        }
        
        // 3. 고객 정보에서 직접 확인 (향후 구현)
        if (customer.getMilitaryStatus() != null && 
            !customer.getMilitaryStatus().equals("NONE")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 고객이 군인 전용 상품을 가입했는지 확인
     */
    private boolean hasMilitaryProducts(CustomerDto customer) {
        if (customer.getProducts() == null) return false;
        
        return customer.getProducts().stream()
            .anyMatch(product -> 
                product.getProductName().contains("장병") || 
                product.getProductName().contains("군인") ||
                product.getProductId().contains("장병") ||
                product.getProductId().contains("군인")
            );
    }
    
    /**
     * 상담 이력에서 군인 관련 키워드 확인
     */
    private boolean hasMilitaryKeywordsInHistory(CustomerDto customer) {
        // 실제로는 ConsultationHistoryRepository를 주입받아서 사용
        // 여기서는 시뮬레이션
        return false;
    }
    
    /**
     * 고객의 고용 상태 확인 (시뮬레이션)
     */
    private String getCustomerEmploymentStatus(CustomerDto customer) {
        // 실제로는 고객 정보에서 확인
        return "정규직"; // 기본값
    }
    
    /**
     * 자격 조건 검증 결과 클래스
     */
    public static class EligibilityResult {
        private boolean eligible;
        private List<String> reasons;
        
        public EligibilityResult() {
            this.reasons = new java.util.ArrayList<>();
        }
        
        public void addReason(String reason) {
            this.reasons.add(reason);
        }
        
        // Getters and Setters
        public boolean isEligible() { return eligible; }
        public void setEligible(boolean eligible) { this.eligible = eligible; }
        public List<String> getReasons() { return reasons; }
        public void setReasons(List<String> reasons) { this.reasons = reasons; }
    }
}
