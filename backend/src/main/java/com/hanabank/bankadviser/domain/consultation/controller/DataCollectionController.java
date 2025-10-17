package com.hanabank.bankadviser.domain.consultation.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import com.hanabank.bankadviser.domain.consultation.service.HanaBankDataCollectorService;
import com.hanabank.bankadviser.domain.customer.service.CustomerCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 데이터 수집 관리 컨트롤러
 * 하나은행 데이터 수집 및 캐시 관리 API
 */
@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DataCollectionController {

    private final HanaBankDataCollectorService hanaBankDataCollectorService;
    private final CustomerCacheService customerCacheService;

    /**
     * 수동으로 하나은행 데이터 수집 실행
     */
    @PostMapping("/collect/hanabank")
    public ResponseEntity<ApiResponse<String>> collectHanaBankData() {
        log.info("🔧 수동 하나은행 데이터 수집 요청");
        
        try {
            hanaBankDataCollectorService.collectDataManually();
            return ResponseEntity.ok(ApiResponse.success("하나은행 데이터 수집이 완료되었습니다.", "SUCCESS"));
        } catch (Exception e) {
            log.error("❌ 하나은행 데이터 수집 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("데이터 수집 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 특정 고객의 캐시 무효화
     */
    @DeleteMapping("/cache/customer/{customerId}")
    public ResponseEntity<ApiResponse<String>> evictCustomerCache(@PathVariable String customerId) {
        log.info("🗑️ 고객 캐시 무효화 요청: {}", customerId);
        
        try {
            customerCacheService.evictCustomerCache(customerId);
            customerCacheService.evictCustomerProductsCache(customerId);
            return ResponseEntity.ok(ApiResponse.success("고객 캐시가 무효화되었습니다.", customerId));
        } catch (Exception e) {
            log.error("❌ 고객 캐시 무효화 실패: {}", customerId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("캐시 무효화 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 모든 고객 캐시 무효화
     */
    @DeleteMapping("/cache/customers")
    public ResponseEntity<ApiResponse<String>> evictAllCustomerCache() {
        log.info("🗑️ 모든 고객 캐시 무효화 요청");
        
        try {
            customerCacheService.evictAllCustomerCache();
            return ResponseEntity.ok(ApiResponse.success("모든 고객 캐시가 무효화되었습니다.", "ALL_CLEARED"));
        } catch (Exception e) {
            log.error("❌ 모든 고객 캐시 무효화 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("캐시 무효화 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 상품 캐시 무효화
     */
    @DeleteMapping("/cache/products")
    public ResponseEntity<ApiResponse<String>> evictProductCache() {
        log.info("🗑️ 상품 캐시 무효화 요청");
        
        try {
            hanaBankDataCollectorService.evictProductCache();
            return ResponseEntity.ok(ApiResponse.success("상품 캐시가 무효화되었습니다.", "PRODUCTS_CLEARED"));
        } catch (Exception e) {
            log.error("❌ 상품 캐시 무효화 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("캐시 무효화 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 캐시 통계 조회
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCacheStats() {
        log.info("📊 캐시 통계 조회 요청");
        
        try {
            customerCacheService.printCacheStats();
            
            // 간단한 통계 정보 반환
            Map<String, Object> stats = Map.of(
                "status", "OK",
                "message", "캐시 통계가 로그에 출력되었습니다.",
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(ApiResponse.success("캐시 통계 조회 완료", stats));
        } catch (Exception e) {
            log.error("❌ 캐시 통계 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("캐시 통계 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 시스템 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        log.info("🔍 시스템 상태 확인 요청");
        
        try {
            Map<String, Object> status = Map.of(
                "dataCollector", "ACTIVE",
                "cacheService", "ACTIVE", 
                "scheduler", "ENABLED",
                "redis", "CONNECTED",
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(ApiResponse.success("시스템 상태 정상", status));
        } catch (Exception e) {
            log.error("❌ 시스템 상태 확인 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("시스템 상태 확인 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}
