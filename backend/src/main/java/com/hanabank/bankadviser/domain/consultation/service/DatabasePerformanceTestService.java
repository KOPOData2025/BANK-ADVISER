package com.hanabank.bankadviser.domain.consultation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

// @Service
@Slf4j
public class DatabasePerformanceTestService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * 현재 데이터베이스 상태 확인
     */
    public Map<String, Object> getCurrentDatabaseStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 테이블별 레코드 수 조회
            stats.put("customerCount", getTableCount("customer"));
            stats.put("productCount", getTableCount("product_details"));
            stats.put("sessionCount", getTableCount("bank_teller_consultation_sessions"));
            stats.put("formCount", getTableCount("form_submission"));
            
            // 테이블 크기 조회
            stats.put("tableSizes", getTableSizes());
            
            // 인덱스 정보 조회
            stats.put("indexes", getIndexInfo());
            
            log.info("현재 데이터베이스 상태: {}", stats);
            
        } catch (Exception e) {
            log.error("데이터베이스 상태 조회 실패", e);
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * 소규모 테스트 데이터 생성 (1만 건)
     */
    @Transactional
    public Map<String, Object> generateSmallTestData() {
        log.info("=== 소규모 테스트 데이터 생성 시작 (1만 건) ===");
        
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. 고객 데이터 생성 (1만 건)
            int customerCount = generateCustomers(10_000);
            result.put("customerCount", customerCount);
            
            // 2. 상품 데이터 생성 (1천 건)
            int productCount = generateProducts(1_000);
            result.put("productCount", productCount);
            
            // 3. 상담 세션 데이터 생성 (5천 건)
            int sessionCount = generateConsultationSessions(5_000);
            result.put("sessionCount", sessionCount);
            
            long endTime = System.currentTimeMillis();
            result.put("success", true);
            result.put("generationTime", endTime - startTime);
            result.put("message", "소규모 테스트 데이터 생성 완료");
            
            log.info("소규모 테스트 데이터 생성 완료: {}ms", endTime - startTime);
            
        } catch (Exception e) {
            log.error("소규모 테스트 데이터 생성 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 성능 테스트 실행
     */
    public Map<String, Object> runPerformanceTest() {
        log.info("=== 데이터베이스 성능 테스트 시작 ===");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
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
            result.put("message", "성능 테스트 완료");
            
            log.info("=== 성능 테스트 완료 ===");
            log.info("결과: {}", result);
            
        } catch (Exception e) {
            log.error("성능 테스트 실행 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 고객 데이터 생성
     */
    private int generateCustomers(int count) {
        log.info("고객 데이터 생성 시작: {} 건", count);
        
        String sql = "INSERT INTO customer (" +
            "customerid, name, dateofbirth, contactnumber, " +
            "address, gender, registrationdate, total_assets, " +
            "monthly_income, investment_goal, risk_tolerance, " +
            "investment_period, financial_health_score" +
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        Random random = new Random();
        
        for (int i = 1; i <= count; i++) {
            Object[] args = {
                "TEST_C" + String.format("%06d", i),
                generateRandomName(),
                generateRandomDate(),
                generateRandomPhone(),
                generateRandomAddress(),
                generateRandomGender(),
                LocalDateTime.now().minusDays(random.nextInt(3650)),
                BigDecimal.valueOf(random.nextInt(100000000)),
                BigDecimal.valueOf(random.nextInt(10000000)),
                generateRandomInvestmentGoal(),
                generateRandomRiskTolerance(),
                random.nextInt(30) + 1,
                random.nextInt(100)
            };
            batchArgs.add(args);
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                if (i % 1000 == 0) {
                    log.info("고객 데이터 생성 진행률: {}/{}", i, count);
                }
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("고객 데이터 생성 완료: {} 건", count);
        return count;
    }
    
    /**
     * 상품 데이터 생성
     */
    private int generateProducts(int count) {
        log.info("상품 데이터 생성 시작: {} 건", count);
        
        String sql = "INSERT INTO product_details (" +
            "product_name, product_url, category, basic_rates, " +
            "applied_rates, preferential_rates, product_info, crawled_at" +
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        Random random = new Random();
        String[] categories = {"예금", "적금", "대출", "펀드", "보험", "카드"};
        String[] productTypes = {"하나", "우리", "신한", "국민", "농협", "기업"};
        
        for (int i = 1; i <= count; i++) {
            String category = categories[random.nextInt(categories.length)];
            String productType = productTypes[random.nextInt(productTypes.length)];
            
            Object[] args = {
                productType + " " + category + " 상품 " + i,
                "https://example.com/product/" + i,
                category,
                String.valueOf(random.nextDouble() * 5.0 + 1.0),
                String.valueOf(random.nextDouble() * 5.0 + 1.0),
                String.valueOf(random.nextDouble() * 2.0 + 0.5),
                "상품 설명 " + i + " - " + generateRandomText(200),
                Timestamp.valueOf(LocalDateTime.now().minusDays(random.nextInt(365)))
            };
            batchArgs.add(args);
            
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                if (i % 1000 == 0) {
                    log.info("상품 데이터 생성 진행률: {}/{}", i, count);
                }
            }
        }
        
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("상품 데이터 생성 완료: {} 건", count);
        return count;
    }
    
    /**
     * 상담 세션 데이터 생성
     */
    private int generateConsultationSessions(int count) {
        log.info("상담 세션 데이터 생성 시작: {} 건", count);
        
        String sql = "INSERT INTO bank_teller_consultation_sessions (" +
            "session_id, employee_id, customer_name, customer_phone, " +
            "customer_age, customer_income, customer_assets, " +
            "investment_goal, risk_tolerance, investment_period, status" +
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        Random random = new Random();
        
        for (int i = 1; i <= count; i++) {
            Object[] args = {
                "SESSION_" + String.format("%06d", i),
                "EMP_" + String.format("%03d", random.nextInt(100) + 1),
                generateRandomName(),
                generateRandomPhone(),
                random.nextInt(50) + 20,
                (long) (random.nextInt(100000000) + 1000000),
                (long) (random.nextInt(500000000) + 10000000),
                generateRandomInvestmentGoal(),
                generateRandomRiskTolerance(),
                random.nextInt(30) + 1,
                "completed"
            };
            batchArgs.add(args);
            
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                if (i % 1000 == 0) {
                    log.info("상담 세션 데이터 생성 진행률: {}/{}", i, count);
                }
            }
        }
        
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("상담 세션 데이터 생성 완료: {} 건", count);
        return count;
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
            "SELECT * FROM product_details WHERE category = ?",
            "SELECT * FROM bank_teller_consultation_sessions WHERE customer_name = ?"
        };
        
        String[] testParams = {
            "김철수", "010-1234-5678", "%하나%", "예금", "김철수"
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
            "CREATE INDEX IF NOT EXISTS idx_product_category ON product_details(category)",
            "CREATE INDEX IF NOT EXISTS idx_session_customer_name ON bank_teller_consultation_sessions(customer_name)"
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
    
    /**
     * 테이블 레코드 수 조회
     */
    private long getTableCount(String tableName) {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
        } catch (Exception e) {
            log.warn("테이블 {} 레코드 수 조회 실패", tableName, e);
            return 0;
        }
    }
    
    /**
     * 테이블 크기 조회
     */
    private Map<String, Object> getTableSizes() {
        Map<String, Object> sizes = new HashMap<>();
        try {
            String sql = "SELECT " +
                "schemaname, " +
                "tablename, " +
                "pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size " +
                "FROM pg_tables " +
                "WHERE schemaname = 'public' " +
                "ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
            sizes.put("tableSizes", results);
            
        } catch (Exception e) {
            log.warn("테이블 크기 조회 실패", e);
            sizes.put("error", e.getMessage());
        }
        return sizes;
    }
    
    /**
     * 인덱스 정보 조회
     */
    private Map<String, Object> getIndexInfo() {
        Map<String, Object> indexes = new HashMap<>();
        try {
            String sql = "SELECT " +
                "indexname, " +
                "tablename, " +
                "indexdef " +
                "FROM pg_indexes " +
                "WHERE schemaname = 'public' " +
                "ORDER BY tablename, indexname";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
            indexes.put("indexes", results);
            
        } catch (Exception e) {
            log.warn("인덱스 정보 조회 실패", e);
            indexes.put("error", e.getMessage());
        }
        return indexes;
    }
    
    /**
     * 테스트 데이터 정리
     */
    @Transactional
    public Map<String, Object> cleanupTestData() {
        log.info("=== 테스트 데이터 정리 시작 ===");
        
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            // 테스트 데이터 삭제
            int deletedCustomers = jdbcTemplate.update("DELETE FROM customer WHERE customerid LIKE 'TEST_C%'");
            int deletedProducts = jdbcTemplate.update("DELETE FROM product_details WHERE product_name LIKE '%상품%'");
            int deletedSessions = jdbcTemplate.update("DELETE FROM bank_teller_consultation_sessions WHERE session_id LIKE 'SESSION_%'");
            
            // 인덱스 삭제
            String[] dropIndexQueries = {
                "DROP INDEX IF EXISTS idx_customer_name",
                "DROP INDEX IF EXISTS idx_customer_contact", 
                "DROP INDEX IF EXISTS idx_product_name",
                "DROP INDEX IF EXISTS idx_product_category",
                "DROP INDEX IF EXISTS idx_session_customer_name"
            };
            
            for (String query : dropIndexQueries) {
                try {
                    jdbcTemplate.execute(query);
                } catch (Exception e) {
                    log.warn("인덱스 삭제 실패: {}", query, e);
                }
            }
            
            long endTime = System.currentTimeMillis();
            
            result.put("success", true);
            result.put("deletedCustomers", deletedCustomers);
            result.put("deletedProducts", deletedProducts);
            result.put("deletedSessions", deletedSessions);
            result.put("cleanupTime", endTime - startTime);
            result.put("message", "테스트 데이터 정리 완료");
            
            log.info("테스트 데이터 정리 완료: {}ms", endTime - startTime);
            
        } catch (Exception e) {
            log.error("테스트 데이터 정리 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    // 헬퍼 메서드들
    private String generateRandomName() {
        String[] surnames = {"김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"};
        String[] givenNames = {"철수", "영희", "민수", "지영", "현우", "서연", "준호", "미영", "성민", "예진"};
        Random random = new Random();
        return surnames[random.nextInt(surnames.length)] + 
               givenNames[random.nextInt(givenNames.length)];
    }
    
    private LocalDate generateRandomDate() {
        Random random = new Random();
        return LocalDate.now().minusYears(random.nextInt(50) + 20);
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
    
    private String generateRandomText(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
