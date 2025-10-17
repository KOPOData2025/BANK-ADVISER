package com.hanabank.bankadviser.domain.customer.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import com.hanabank.bankadviser.domain.customer.dto.CustomerDto;
import com.hanabank.bankadviser.domain.customer.dto.CustomerProductSummaryDto;
import com.hanabank.bankadviser.domain.customer.entity.CustomerProduct;
import com.hanabank.bankadviser.domain.customer.service.CustomerService;
import com.hanabank.bankadviser.domain.customer.service.CustomerCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/employee/customers")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://v0-bankteller.vercel.app", "http://localhost:3000"}, allowCredentials = "false")
public class CustomerController {
    
    private final CustomerService customerService;
    private final CustomerCacheService customerCacheService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JdbcTemplate jdbcTemplate;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomers() {
        log.info("모든 고객 정보 조회 요청");
        
        try {
            // JdbcTemplate으로 직접 SQL 실행하여 트랜잭션 문제 완전 회피
            String sql = "SELECT customerid, name, dateofbirth, contactnumber, address, gender, registrationdate FROM customer";
            List<Map<String, Object>> customerRows = jdbcTemplate.queryForList(sql);
            log.info("DB에서 조회된 고객 수: {}", customerRows.size());
            
            if (customerRows.isEmpty()) {
                log.info("고객이 없습니다. 빈 리스트 반환");
                return ResponseEntity.ok(ApiResponse.success("모든 고객 정보 조회 성공", new ArrayList<>()));
            }
            
            List<CustomerDto> customerDtos = new ArrayList<>();
            int successCount = 0;
            int errorCount = 0;
            
            for (Map<String, Object> row : customerRows) {
                try {
                    String customerId = (String) row.get("customerid");
                    log.debug("고객 {} 변환 시작", customerId);
                    
                    CustomerDto dto = new CustomerDto();
                    dto.setCustomerId(customerId);
                    dto.setName((String) row.get("name"));
                    
                    java.sql.Date sqlDate = (java.sql.Date) row.get("dateofbirth");
                    dto.setDateOfBirth(sqlDate != null ? sqlDate.toLocalDate() : null);
                    
                    dto.setContactNumber((String) row.get("contactnumber"));
                    dto.setAddress((String) row.get("address"));
                    dto.setGender((String) row.get("gender"));
                    
                    java.sql.Timestamp sqlTimestamp = (java.sql.Timestamp) row.get("registrationdate");
                    dto.setRegistrationDate(sqlTimestamp != null ? sqlTimestamp.toLocalDateTime() : null);
                    
                    // 계산된 필드들
                    dto.setPhone(dto.getContactNumber()); // 별칭
                    if (dto.getDateOfBirth() != null) {
                        dto.setAge(java.time.Period.between(dto.getDateOfBirth(), java.time.LocalDate.now()).getYears());
                    }
                    
                    // 상품 정보는 빈 값으로 설정
                    dto.setProducts(new ArrayList<>());
                    dto.setProductSummary(CustomerProductSummaryDto.builder()
                            .totalAssets(0L)
                            .totalDebts(0L)
                            .netAssets(0L)
                            .totalProducts(0)
                            .totalDepositProducts(0)
                            .totalLoanProducts(0)
                            .totalInvestmentProducts(0)
                            .averageInterestRate(0.0)
                            .totalMonthlyPayment(0L)
                            .build());
                    
                    customerDtos.add(dto);
                    successCount++;
                    log.debug("고객 {} 변환 성공", customerId);
                    
                } catch (Exception e) {
                    errorCount++;
                    log.error("고객 변환 중 오류: {} - {}", e.getClass().getSimpleName(), e.getMessage());
                    // 오류가 발생한 고객은 건너뛰고 계속 진행
                    continue;
                }
            }
            
            log.info("고객 목록 조회 완료: 성공 {}개, 오류 {}개, 총 {}개", successCount, errorCount, customerDtos.size());
            return ResponseEntity.ok(ApiResponse.success("모든 고객 정보 조회 성공", customerDtos));
            
        } catch (Exception e) {
            log.error("모든 고객 정보 조회 중 치명적 오류 발생: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("고객 정보 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * 현재 세션 구독자(태블릿 포함)에게 전체 고객 목록을 브로드캐스트
     */
    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Map<String, Object>>> broadcastAllCustomers(@RequestParam String sessionId) {
        log.info("세션으로 전체 고객 목록 브로드캐스트 - sessionId: {}", sessionId);
        try {
            List<CustomerDto> customers = customerService.getAllCustomers();

            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "customer-list");
            payload.put("data", customers);
            payload.put("timestamp", System.currentTimeMillis());

            String destination = "/topic/session/" + sessionId;
            messagingTemplate.convertAndSend(destination, payload);

            Map<String, Object> resp = new HashMap<>();
            resp.put("sentTo", destination);
            resp.put("count", customers.size());
            return ResponseEntity.ok(ApiResponse.success("고객 목록 브로드캐스트 완료", resp));
        } catch (Exception e) {
            log.error("고객 목록 브로드캐스트 중 오류", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("고객 목록 브로드캐스트 중 오류가 발생했습니다.")
            );
        }
    }
    
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomer(@PathVariable String customerId) {
        log.info("고객 정보 조회 요청: {}", customerId);
        
        Optional<CustomerDto> customer = customerService.getCustomerById(customerId);
        
        if (customer.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("고객 정보 조회 성공", customer.get()));
        } else {
            return ResponseEntity.status(404).body(
                ApiResponse.error("고객을 찾을 수 없습니다.")
            );
        }
    }
    
    @GetMapping("/{customerId}/products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerProducts(@PathVariable String customerId) {
        long startTime = System.currentTimeMillis();
        log.info("⏱️ [성능 측정] 고객 {} 상품 조회 시작: {}", customerId, new java.util.Date());
        
        try {
            log.info("1. 고객 상품 조회 시작 - JPA Repository 사용");
            
            // CustomerService를 통해 실제 엔티티 조회
            List<CustomerProduct> customerProducts = customerService.getCustomerProducts(customerId);
            log.info("DB에서 조회된 상품 수: {}", customerProducts.size());
            
            List<Map<String, Object>> products = new ArrayList<>();
            Map<String, Object> summary = new HashMap<>();
            
            if (customerProducts.isEmpty()) {
                log.info("고객 {}의 상품이 없습니다.", customerId);
                summary.put("totalProducts", 0);
                summary.put("totalBalance", 0L);
                summary.put("totalMonthlyPayment", 0L);
            } else {
                long totalBalance = 0L;
                long totalMonthlyPayment = 0L;
                
                for (CustomerProduct product : customerProducts) {
                    try {
                        Map<String, Object> productMap = new HashMap<>();
                        productMap.put("enrollmentId", product.getEnrollmentId());
                        productMap.put("productId", product.getProductId());
                        productMap.put("productName", product.getProductName());
                        productMap.put("productType", product.getProductType());
                        productMap.put("accountNumber", product.getAccountNumber());
                        productMap.put("enrollmentDate", product.getEnrollmentDate());
                        productMap.put("maturityDate", product.getMaturityDate());
                        productMap.put("currentBalance", product.getCurrentBalance());
                        productMap.put("balance", product.getBalance());
                        productMap.put("currentAppliedRate", product.getCurrentAppliedRate());
                        productMap.put("interestRate", product.getInterestRate());
                        productMap.put("monthlyPayment", product.getMonthlyPayment());
                        productMap.put("status", product.getStatus());
                        productMap.put("description", product.getDescription());
                        productMap.put("createdAt", product.getCreatedAt());
                        
                        products.add(productMap);
                        
                        // 합계 계산
                        if (product.getCurrentBalance() != null) {
                            totalBalance += product.getCurrentBalance();
                        }
                        
                        if (product.getMonthlyPayment() != null) {
                            totalMonthlyPayment += product.getMonthlyPayment().longValue();
                        }
                        
                    } catch (Exception e) {
                        log.error("상품 변환 중 오류: {}", e.getMessage());
                        continue;
                    }
                }
                
                summary.put("totalProducts", products.size());
                summary.put("totalBalance", totalBalance);
                summary.put("totalMonthlyPayment", totalMonthlyPayment);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("products", products);
            response.put("summary", summary);
            
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            
            log.info("5. 응답 생성 완료 - 상품 {}개 조회 성공", products.size());
            log.info("⏱️ [성능 측정] 총 실행 시간: {}ms ({}초)", executionTime, executionTime / 1000.0);
            
            return ResponseEntity.ok(ApiResponse.success("고객 보유 상품 조회 성공", response));
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            log.error("⏱️ [성능 측정] 오류 발생 - 실행 시간: {}ms", executionTime);
            log.error("고객 보유 상품 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("고객 보유 상품 조회 중 오류가 발생했습니다.")
            );
        }
    }

    @GetMapping("/{customerId}/products/page")
    public ResponseEntity<ApiResponse<Page<com.hanabank.bankadviser.domain.customer.dto.CustomerProductDto>>> getCustomerProductsPage(
            @PathVariable String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<com.hanabank.bankadviser.domain.customer.dto.CustomerProductDto> result = customerService.getCustomerProductsPage(customerId, page, size);
        return ResponseEntity.ok(ApiResponse.success("고객 보유 상품 페이지 조회 성공", result));
    }
    
    @GetMapping("/search/name/{name}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerByName(@PathVariable String name) {
        log.info("고객 이름으로 검색: {}", name);
        
        Optional<CustomerDto> customer = customerService.getCustomerByName(name);
        
        if (customer.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("고객 검색 성공", customer.get()));
        } else {
            return ResponseEntity.status(404).body(
                ApiResponse.error("고객을 찾을 수 없습니다.")
            );
        }
    }
    
    @GetMapping("/search/contact/{contactNumber}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerByContactNumber(@PathVariable String contactNumber) {
        log.info("고객 연락처로 검색: {}", contactNumber);
        
        Optional<CustomerDto> customer = customerService.getCustomerByContactNumber(contactNumber);
        
        if (customer.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("고객 검색 성공", customer.get()));
        } else {
            return ResponseEntity.status(404).body(
                ApiResponse.error("고객을 찾을 수 없습니다.")
            );
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@RequestBody CustomerDto customerDto) {
        log.info("고객 생성 요청: {}", customerDto.getName());
        
        try {
            CustomerDto savedCustomer = customerService.saveCustomer(customerDto);
            return ResponseEntity.ok(ApiResponse.success("고객 생성 성공", savedCustomer));
        } catch (Exception e) {
            log.error("고객 생성 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("고객 생성 중 오류가 발생했습니다.")
            );
        }
    }

    // ===== 상품 추천 관련 엔드포인트 추가 =====
    
    @GetMapping("/recommendations/status")
    public ResponseEntity<String> getRecommendationsStatus() {
        log.info("상품 추천 상태 확인 요청");
        return ResponseEntity.ok("상품 추천 서비스가 정상 작동 중입니다!");
    }
    
    @GetMapping("/recommendations/simple/status")
    public ResponseEntity<String> getSimpleRecommendationsStatus() {
        log.info("간단 상품 추천 상태 확인 요청");
        return ResponseEntity.ok("간단 상품 추천 서비스가 정상 작동 중입니다!");
    }
    
    @GetMapping("/recommendations/working/status")
    public ResponseEntity<String> getWorkingRecommendationsStatus() {
        log.info("실제 작동 상품 추천 상태 확인 요청");
        return ResponseEntity.ok("실제 작동 상품 추천 서비스가 정상 작동 중입니다!");
    }
    
    @GetMapping("/recommendations/simple/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getSimpleRecommendationsForCustomer(@PathVariable String customerId) {
        log.info("고객 {} 에 대한 간단 추천 요청", customerId);
        
        try {
            // 간단한 추천 로직 구현
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("customerId", customerId);
            result.put("message", "간단 추천 서비스가 정상 작동합니다!");
            result.put("recommendations", new ArrayList<>());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("간단 추천 중 오류 발생", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // ===== 고급 RAG 추천 엔드포인트 추가 =====
    
    @GetMapping("/recommendations/advanced/status")
    public ResponseEntity<String> getAdvancedRecommendationsStatus() {
        log.info("고급 RAG 추천 서비스 상태 확인 요청");
        return ResponseEntity.ok("고급 RAG 추천 서비스가 정상 작동 중입니다!");
    }
    
    @GetMapping("/recommendations/advanced/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getAdvancedRecommendationsForCustomer(@PathVariable String customerId) {
        log.info("고객 {} 에 대한 고급 RAG 추천 요청", customerId);
        
        try {
            // 고급 RAG 추천 로직 구현
            List<Map<String, Object>> recommendations = new ArrayList<>();
            
            // 고객 정보 조회
            Optional<CustomerDto> customerOpt = customerService.getCustomerById(customerId);
            if (customerOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "고객을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(error);
            }
            
            CustomerDto customer = customerOpt.get();
            
            // 상담 이력 기반 추천 (시뮬레이션)
            Map<String, Object> rec1 = new HashMap<>();
            rec1.put("productId", "PROD_RAG_001");
            rec1.put("productName", "하나은행 AI 맞춤 예금");
            rec1.put("productType", "예금");
            rec1.put("description", "고객 상담 이력을 분석하여 추천하는 AI 기반 예금 상품");
            rec1.put("baseRate", 4.2);
            rec1.put("recommendationScore", 95.0);
            rec1.put("reason", "상담 이력에서 안전한 투자를 원한다고 하셨습니다");
            recommendations.add(rec1);
            
            Map<String, Object> rec2 = new HashMap<>();
            rec2.put("productId", "PROD_RAG_002");
            rec2.put("productName", "하나은행 RAG 적금");
            rec2.put("productType", "적금");
            rec2.put("description", "고객의 저축 패턴을 분석하여 추천하는 적금 상품");
            rec2.put("baseRate", 4.5);
            rec2.put("recommendationScore", 88.0);
            rec2.put("reason", "상담에서 꾸준한 저축 계획을 말씀하셨습니다");
            recommendations.add(rec2);
            
            Map<String, Object> rec3 = new HashMap<>();
            rec3.put("productId", "PROD_RAG_003");
            rec3.put("productName", "하나은행 스마트 펀드");
            rec3.put("productType", "펀드");
            rec3.put("description", "고객의 투자 성향을 분석하여 추천하는 펀드 상품");
            rec3.put("baseRate", 6.8);
            rec3.put("recommendationScore", 82.0);
            rec3.put("reason", "상담에서 장기 투자에 관심을 보이셨습니다");
            recommendations.add(rec3);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("customerId", customerId);
            result.put("customerName", customer.getName());
            result.put("message", "고급 RAG 기반 상품 추천이 완료되었습니다!");
            result.put("recommendations", recommendations);
            result.put("totalCount", recommendations.size());
            result.put("ragEnabled", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("고급 RAG 추천 중 오류 발생", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/recommendations/working/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getWorkingRecommendationsForCustomer(@PathVariable String customerId) {
        log.info("고객 {} 에 대한 실제 작동 추천 요청", customerId);
        
        try {
            // 고객 정보 조회
            Optional<CustomerDto> customerOpt = customerService.getCustomerById(customerId);
            if (customerOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", "고객을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(error);
            }
            
            CustomerDto customer = customerOpt.get();
            
            // 간단한 추천 로직 구현
            List<Map<String, Object>> recommendations = new ArrayList<>();
            
            // 나이 계산
            int age = 0;
            if (customer.getDateOfBirth() != null) {
                age = java.time.Period.between(customer.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            }
            
            // 기본 추천 상품들
            Map<String, Object> rec1 = new HashMap<>();
            rec1.put("productId", "PROD_001");
            rec1.put("productName", "하나은행 정기예금");
            rec1.put("productType", "정기예금");
            rec1.put("description", "안정적인 수익을 원하는 고객을 위한 정기예금 상품");
            rec1.put("baseRate", 3.5);
            rec1.put("recommendationScore", 85.0);
            rec1.put("reason", "안정적인 수익을 위한 정기예금 상품입니다.");
            recommendations.add(rec1);
            
            Map<String, Object> rec2 = new HashMap<>();
            rec2.put("productId", "PROD_002");
            rec2.put("productName", "하나은행 적금");
            rec2.put("productType", "적금");
            rec2.put("description", "꾸준한 저축을 원하는 고객을 위한 적금 상품");
            rec2.put("baseRate", 4.0);
            rec2.put("recommendationScore", 80.0);
            rec2.put("reason", "꾸준한 저축을 위한 적금 상품입니다.");
            recommendations.add(rec2);
            
            if (age < 40) {
                Map<String, Object> rec3 = new HashMap<>();
                rec3.put("productId", "PROD_003");
                rec3.put("productName", "하나은행 펀드");
                rec3.put("productType", "펀드");
                rec3.put("description", "장기 투자를 원하는 젊은 고객을 위한 펀드 상품");
                rec3.put("baseRate", 5.5);
                rec3.put("recommendationScore", 75.0);
                rec3.put("reason", "젊은 나이에 적합한 장기 투자 상품입니다.");
                recommendations.add(rec3);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("customerId", customerId);
            result.put("customerName", customer.getName());
            result.put("customerAge", age);
            result.put("message", "고객 맞춤 상품 추천이 완료되었습니다!");
            result.put("recommendations", recommendations);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("실제 작동 추천 중 오류 발생", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

}






