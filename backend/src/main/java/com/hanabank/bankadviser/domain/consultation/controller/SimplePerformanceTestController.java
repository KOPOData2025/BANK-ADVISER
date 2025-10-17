package com.hanabank.bankadviser.domain.consultation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

// @RestController
@RequestMapping("/api/simple-performance")
@Slf4j
public class SimplePerformanceTestController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * 작은 단위 테스트 데이터 생성 (1000건)
     */
    @PostMapping("/generate-small-batch")
    public ResponseEntity<Map<String, Object>> generateSmallBatch() {
        try {
            log.info("작은 단위 테스트 데이터 생성 시작 (1000건)");
            
            Map<String, Object> result = new HashMap<>();
            long startTime = System.currentTimeMillis();
            
            // 1000건씩 배치로 고객 데이터 생성
            int customerCount = generateCustomersBatch(1000);
            result.put("customerCount", customerCount);
            
            long endTime = System.currentTimeMillis();
            result.put("success", true);
            result.put("generationTime", endTime - startTime);
            result.put("message", "작은 단위 테스트 데이터 생성 완료");
            
            log.info("작은 단위 테스트 데이터 생성 완료: {}ms", endTime - startTime);
            
            return ResponseEntity.ok(result);
            
            } catch (Exception e) {
                log.error("작은 단위 테스트 데이터 생성 실패", e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "테스트 데이터 생성 실패: " + e.getMessage());
                return ResponseEntity.status(500).body(errorResponse);
            }
    }
    
    /**
     * 고객 데이터 배치 생성 (트랜잭션 없이)
     */
    private int generateCustomersBatch(int count) {
        log.info("고객 데이터 배치 생성 시작: {} 건", count);
        
        String sql = "INSERT INTO customer (" +
            "customerid, name, dateofbirth, contactnumber, " +
            "address, gender, registrationdate, total_assets, " +
            "monthly_income, investment_goal, risk_tolerance, " +
            "investment_period, financial_health_score" +
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        Random random = new Random();
        int successCount = 0;
        
        for (int i = 1; i <= count; i++) {
            try {
                Object[] args = {
                    "BATCH_C" + String.format("%06d", i),
                    generateRandomName(),
                    generateRandomDate(),
                    generateRandomPhone(),
                    generateRandomAddress(),
                    generateRandomGender(),
                    java.time.LocalDateTime.now().minusDays(random.nextInt(3650)),
                    java.math.BigDecimal.valueOf(random.nextInt(100000000)),
                    java.math.BigDecimal.valueOf(random.nextInt(10000000)),
                    generateRandomInvestmentGoal(),
                    generateRandomRiskTolerance(),
                    random.nextInt(30) + 1,
                    random.nextInt(100)
                };
                
                jdbcTemplate.update(sql, args);
                successCount++;
                
                if (i % 100 == 0) {
                    log.info("고객 데이터 생성 진행률: {}/{}", i, count);
                }
                
            } catch (Exception e) {
                log.warn("고객 데이터 생성 실패: {}", i, e);
            }
        }
        
        log.info("고객 데이터 배치 생성 완료: {} 건", successCount);
        return successCount;
    }
    
    /**
     * 현재 데이터베이스 상태 확인
     */
    @GetMapping("/current-stats")
    public ResponseEntity<Map<String, Object>> getCurrentStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // 테이블별 레코드 수 조회
            stats.put("customerCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM customer", Long.class));
            stats.put("productCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM product_details", Long.class));
            stats.put("sessionCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bank_teller_consultation_sessions", Long.class));
            
            return ResponseEntity.ok(stats);
            
            } catch (Exception e) {
                log.error("데이터베이스 상태 조회 실패", e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", e.getMessage());
                return ResponseEntity.status(500).body(errorResponse);
            }
    }
    
    /**
     * 성능 테스트 (현재 데이터 기준)
     */
    @PostMapping("/test-current")
    public ResponseEntity<Map<String, Object>> testCurrentData() {
        try {
            log.info("현재 데이터 기준 성능 테스트 시작");
            
            Map<String, Object> result = new HashMap<>();
            
            // 1. 인덱스 없이 테스트
            log.info("1단계: 인덱스 없이 성능 테스트");
            Map<String, Long> withoutIndex = performQueries(false);
            result.put("withoutIndex", withoutIndex);
            
            // 2. 인덱스 생성
            log.info("2단계: 인덱스 생성");
            createPerformanceIndexes();
            
            // 3. 인덱스 있이 테스트
            log.info("3단계: 인덱스 있이 성능 테스트");
            Map<String, Long> withIndex = performQueries(true);
            result.put("withIndex", withIndex);
            
            // 4. 결과 분석
            Map<String, Double> improvements = calculateImprovements(withoutIndex, withIndex);
            result.put("improvements", improvements);
            
            result.put("success", true);
            result.put("message", "현재 데이터 기준 성능 테스트 완료");
            
            log.info("현재 데이터 기준 성능 테스트 완료");
            
            return ResponseEntity.ok(result);
            
            } catch (Exception e) {
                log.error("현재 데이터 기준 성능 테스트 실패", e);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "성능 테스트 실행 실패: " + e.getMessage());
                return ResponseEntity.status(500).body(errorResponse);
            }
    }
    
    /**
     * 쿼리 성능 테스트
     */
    private Map<String, Long> performQueries(boolean withIndex) {
        Map<String, Long> queryTimes = new HashMap<>();
        
        // 테스트 쿼리들
        String[] testQueries = {
            "SELECT customerid FROM customer WHERE name = ?",
            "SELECT * FROM customer WHERE contactnumber = ?",
            "SELECT * FROM product_details WHERE product_name LIKE ?",
            "SELECT * FROM product_details WHERE category = ?"
        };
        
        String[] testParams = {
            "김철수", "010-1234-5678", "%하나%", "예금"
        };
        
        for (int i = 0; i < testQueries.length; i++) {
            long startTime = System.currentTimeMillis();
            
            try {
                jdbcTemplate.queryForList(testQueries[i], testParams[i]);
            } catch (Exception e) {
                log.warn("쿼리 실행 실패: {}", testQueries[i], e);
            }
            
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            
            queryTimes.put(testQueries[i], executionTime);
            
            log.info("쿼리 {} 실행 시간: {}ms (인덱스: {})", 
                i + 1, executionTime, withIndex ? "있음" : "없음");
        }
        
        return queryTimes;
    }
    
    /**
     * 성능 개선율 계산
     */
    private Map<String, Double> calculateImprovements(Map<String, Long> withoutIndex, Map<String, Long> withIndex) {
        Map<String, Double> improvements = new HashMap<>();
        
        for (String query : withoutIndex.keySet()) {
            long withoutTime = withoutIndex.get(query);
            long withTime = withIndex.get(query);
            
            if (withoutTime > 0) {
                double improvement = ((double)(withoutTime - withTime) / withoutTime) * 100;
                improvements.put(query, improvement);
            }
        }
        
        return improvements;
    }
    
    /**
     * 성능 최적화 인덱스 생성
     */
    private void createPerformanceIndexes() {
        log.info("성능 최적화 인덱스 생성 시작");
        
        String[] indexQueries = {
            "CREATE INDEX IF NOT EXISTS idx_customer_name ON customer(name)",
            "CREATE INDEX IF NOT EXISTS idx_customer_contact ON customer(contactnumber)",
            "CREATE INDEX IF NOT EXISTS idx_product_name ON product_details(product_name)",
            "CREATE INDEX IF NOT EXISTS idx_product_category ON product_details(category)"
        };
        
        for (String query : indexQueries) {
            try {
                jdbcTemplate.execute(query);
                log.info("인덱스 생성 완료: {}", query);
            } catch (Exception e) {
                log.error("인덱스 생성 실패: {}", query, e);
            }
        }
        
        log.info("성능 최적화 인덱스 생성 완료");
    }
    
    // 헬퍼 메서드들
    private String generateRandomName() {
        String[] surnames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
        String[] givenNames = {"철수", "영희", "민수", "지영", "현우", "서연", "준호", "미영", "성민", "예진"};
        Random random = new Random();
        return surnames[random.nextInt(surnames.length)] + 
               givenNames[random.nextInt(givenNames.length)];
    }
    
    private java.time.LocalDate generateRandomDate() {
        Random random = new Random();
        return java.time.LocalDate.now().minusYears(random.nextInt(50) + 20);
    }
    
    private String generateRandomPhone() {
        Random random = new Random();
        return String.format("010-%04d-%04d", 
            random.nextInt(10000), 
            random.nextInt(10000));
    }
    
    private String generateRandomAddress() {
        String[] cities = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"};
        String[] districts = {"강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "영등포구", "금천구"};
        Random random = new Random();
        return cities[random.nextInt(cities.length)] + " " + 
               districts[random.nextInt(districts.length)] + " " +
               (random.nextInt(999) + 1) + "번지";
    }
    
    private String generateRandomGender() {
        Random random = new Random();
        return random.nextBoolean() ? "M" : "F";
    }
    
    private String generateRandomInvestmentGoal() {
        String[] goals = {"자금관리", "자녀교육", "주택구입", "노후준비", "투자수익"};
        Random random = new Random();
        return goals[random.nextInt(goals.length)];
    }
    
    private String generateRandomRiskTolerance() {
        String[] risks = {"보수적", "안정적", "중립적", "적극적", "공격적"};
        Random random = new Random();
        return risks[random.nextInt(risks.length)];
    }
}
