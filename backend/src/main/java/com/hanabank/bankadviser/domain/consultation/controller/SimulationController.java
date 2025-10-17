package com.hanabank.bankadviser.domain.consultation.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
// @RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "*", allowCredentials = "false")
@RequiredArgsConstructor
public class SimulationController {

    /**
     * 혜택 시뮬레이션 API (캐싱 적용) - 은행 업무의 핵심!
     */
    @PostMapping("/benefits")
    @Cacheable(value = "simulationResults", key = "#request.customerId + '_' + #request.productId")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateBenefits(@RequestBody Map<String, Object> request) {
        log.info("혜택 시뮬레이션 요청: {}", request);
        
        try {
            String customerId = (String) request.get("customerId");
            String productId = (String) request.get("productId");
            
            // 시뮬레이션 결과 생성
            Map<String, Object> simulationResult = new HashMap<>();
            simulationResult.put("customerId", customerId);
            simulationResult.put("productId", productId);
            simulationResult.put("baseInterestRate", 3.0);
            simulationResult.put("preferentialRate", 0.5);
            simulationResult.put("totalRate", 3.5);
            simulationResult.put("expectedReturn", 350000);
            simulationResult.put("monthlyPayment", 100000);
            simulationResult.put("maturityAmount", 1350000);
            simulationResult.put("benefits", Map.of(
                "salaryAccount", "급여계좌 우대 +0.2%",
                "existingCustomer", "기존고객 우대 +0.1%",
                "multipleProducts", "복수상품 우대 +0.2%"
            ));
            
            return ResponseEntity.ok(ApiResponse.success("혜택 시뮬레이션 완료", simulationResult));
        } catch (Exception e) {
            log.error("혜택 시뮬레이션 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("혜택 시뮬레이션 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 금리 조회 API (캐싱 적용)
     */
    @GetMapping("/products/{productId}/rates")
    @Cacheable(value = "productInfo", key = "'rates_' + #productId")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductRates(@PathVariable String productId) {
        log.info("상품 금리 조회 요청 - productId: {}", productId);
        
        try {
            Map<String, Object> rateInfo = new HashMap<>();
            rateInfo.put("productId", productId);
            rateInfo.put("basicRate", 3.0);
            rateInfo.put("maxRate", 3.8);
            rateInfo.put("preferentialConditions", Map.of(
                "salaryAccount", 0.2,
                "existingCustomer", 0.1,
                "multipleProducts", 0.2,
                "youngCustomer", 0.3
            ));
            
            return ResponseEntity.ok(ApiResponse.success("상품 금리 조회 성공", rateInfo));
        } catch (Exception e) {
            log.error("상품 금리 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 금리 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 테스트 엔드포인트
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("시뮬레이션 API가 정상적으로 작동합니다!");
    }
}
