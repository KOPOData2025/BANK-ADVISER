package com.hanabank.bankadviser.domain.consultation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 대용량 테스트 데이터 생성 서비스
 * 성능 테스트를 위한 대규모 데이터셋 생성
 */
// @Service
@Slf4j
public class LargeDatasetGeneratorService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 한국 이름 데이터
    private static final String[] KOREAN_SURNAMES = {
        "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
        "한", "오", "서", "신", "권", "황", "안", "송", "전", "고"
    };
    
    private static final String[] KOREAN_GIVEN_NAMES = {
        "민수", "지영", "현우", "서연", "준호", "수진", "동현", "미영",
        "성민", "예진", "재현", "지현", "민호", "지은", "준영", "서현",
        "태현", "유진", "민지", "현수", "지훈", "서영", "준서", "민정",
        "동욱", "지원", "성호", "예나", "재민", "지민", "민석", "서윤"
    };

    // 상품 카테고리
    private static final String[] PRODUCT_CATEGORIES = {
        "예금", "적금", "대출", "펀드", "보험", "카드", "외환", "투자"
    };

    // 상품명 템플릿
    private static final String[] PRODUCT_TEMPLATES = {
        "하나원복리정기예금", "하나우리적금", "하나주택담보대출", "하나글로벌펀드",
        "하나생명보험", "하나신용카드", "하나외환상품", "하나주식투자",
        "하나자유적금", "하나전세자금대출", "하나채권펀드", "하나건강보험",
        "하나체크카드", "하나환율상품", "하나부동산투자", "하나정기적금"
    };

    /**
     * 대용량 테스트 데이터 생성 (10만건+)
     */
    @Transactional
    public Map<String, Object> generateLargeDataset() {
        log.info("🚀 대용량 테스트 데이터 생성 시작");
        
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. 고객 데이터 생성 (10만건)
            int customerCount = generateCustomers(100000);
            result.put("customers", customerCount);
            
            // 2. 상품 데이터 생성 (1만건)
            int productCount = generateProducts(10000);
            result.put("products", productCount);
            
            // 3. 상담 세션 데이터 생성 (5만건)
            int sessionCount = generateConsultationSessions(50000);
            result.put("sessions", sessionCount);
            
            // 4. 폼 제출 데이터 생성 (2만건)
            int formCount = generateFormSubmissions(20000);
            result.put("forms", formCount);
            
            // 5. 고객-상품 관계 데이터 생성 (3만건)
            int relationCount = generateCustomerProducts(30000);
            result.put("relations", relationCount);
            
            long endTime = System.currentTimeMillis();
            long totalTime = endTime - startTime;
            
            result.put("totalTime", totalTime);
            result.put("success", true);
            result.put("message", "대용량 데이터 생성 완료");
            
            log.info("✅ 대용량 테스트 데이터 생성 완료: {}ms", totalTime);
            log.info("📊 생성된 데이터: 고객 {}건, 상품 {}건, 상담 {}건, 폼 {}건, 관계 {}건", 
                    customerCount, productCount, sessionCount, formCount, relationCount);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 대용량 데이터 생성 실패", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }

    /**
     * 고객 데이터 생성
     */
    private int generateCustomers(int count) {
        log.info("👥 고객 데이터 생성 시작: {}건", count);
        
        String sql = "INSERT INTO customer (customerid, name, contactnumber, dateofbirth, address, " +
                    "monthly_income, total_assets, investment_goal, risk_tolerance, investment_period, " +
                    "gender, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String customerId = "C" + String.format("%06d", i + 1);
            String name = generateRandomKoreanName();
            String phone = generateRandomPhoneNumber();
            LocalDate birthDate = generateRandomBirthDate();
            String address = generateRandomAddress();
            Integer monthlyIncome = generateRandomIncome();
            Long totalAssets = generateRandomAssets();
            String investmentGoal = generateRandomInvestmentGoal();
            String riskTolerance = generateRandomRiskTolerance();
            String investmentPeriod = generateRandomInvestmentPeriod();
            String gender = generateRandomGender();
            LocalDateTime now = LocalDateTime.now();
            
            batchArgs.add(new Object[]{
                customerId, name, phone, birthDate, address,
                monthlyIncome, totalAssets, investmentGoal, riskTolerance, investmentPeriod,
                gender, now, now
            });
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                log.info("📝 고객 데이터 배치 처리: {}건 완료", (i + 1));
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("✅ 고객 데이터 생성 완료: {}건", count);
        return count;
    }

    /**
     * 상품 데이터 생성
     */
    private int generateProducts(int count) {
        log.info("📦 상품 데이터 생성 시작: {}건", count);
        
        String sql = "INSERT INTO product_details (product_name, product_url, category, " +
                    "basic_rates, applied_rates, preferential_rates, product_info, crawled_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String productName = generateRandomProductName();
            String productUrl = "https://www.hanabank.com/products/" + (i + 1);
            String category = PRODUCT_CATEGORIES[ThreadLocalRandom.current().nextInt(PRODUCT_CATEGORIES.length)];
            String basicRates = generateRandomRates();
            String appliedRates = generateRandomRates();
            String preferentialRates = generateRandomRates();
            String productInfo = generateRandomProductInfo();
            LocalDateTime crawledAt = LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365));
            
            batchArgs.add(new Object[]{
                productName, productUrl, category, basicRates, appliedRates, 
                preferentialRates, productInfo, crawledAt
            });
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                log.info("📝 상품 데이터 배치 처리: {}건 완료", (i + 1));
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("✅ 상품 데이터 생성 완료: {}건", count);
        return count;
    }

    /**
     * 상담 세션 데이터 생성
     */
    private int generateConsultationSessions(int count) {
        log.info("💬 상담 세션 데이터 생성 시작: {}건", count);
        
        String sql = "INSERT INTO bank_teller_consultation_sessions " +
                    "(session_id, customer_id, customer_name, customer_phone, employee_id, " +
                    "session_start_time, session_end_time, duration, status, summary, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String sessionId = "session_" + (i + 1);
            String customerId = "C" + String.format("%06d", ThreadLocalRandom.current().nextInt(1, 100001));
            String customerName = generateRandomKoreanName();
            String customerPhone = generateRandomPhoneNumber();
            String employeeId = "EMP" + String.format("%03d", ThreadLocalRandom.current().nextInt(1, 101));
            LocalDateTime startTime = LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365));
            LocalDateTime endTime = startTime.plusMinutes(ThreadLocalRandom.current().nextInt(10, 120));
            Long duration = (long) ThreadLocalRandom.current().nextInt(600, 7200); // 10분~2시간
            String status = ThreadLocalRandom.current().nextBoolean() ? "completed" : "in_progress";
            String summary = generateRandomConsultationSummary();
            LocalDateTime createdAt = startTime;
            
            batchArgs.add(new Object[]{
                sessionId, customerId, customerName, customerPhone, employeeId,
                startTime, endTime, duration, status, summary, createdAt
            });
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                log.info("📝 상담 세션 데이터 배치 처리: {}건 완료", (i + 1));
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("✅ 상담 세션 데이터 생성 완료: {}건", count);
        return count;
    }

    /**
     * 폼 제출 데이터 생성
     */
    private int generateFormSubmissions(int count) {
        log.info("📋 폼 제출 데이터 생성 시작: {}건", count);
        
        String sql = "INSERT INTO form_submission (submission_id, customer_id, employee_id, " +
                    "product_id, product_name, form_id, form_name, form_type, form_data, " +
                    "completion_rate, submitted_at, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String submissionId = "form_" + (i + 1);
            String customerId = "C" + String.format("%06d", ThreadLocalRandom.current().nextInt(1, 100001));
            String employeeId = "EMP" + String.format("%03d", ThreadLocalRandom.current().nextInt(1, 101));
            String productId = "P" + String.format("%06d", ThreadLocalRandom.current().nextInt(1, 10001));
            String productName = generateRandomProductName();
            String formId = "FORM" + String.format("%03d", ThreadLocalRandom.current().nextInt(1, 21));
            String formName = generateRandomFormName();
            String formType = ThreadLocalRandom.current().nextBoolean() ? "application" : "agreement";
            String formData = generateRandomFormData();
            Integer completionRate = ThreadLocalRandom.current().nextInt(50, 101);
            LocalDateTime submittedAt = LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365));
            LocalDateTime createdAt = submittedAt;
            
            batchArgs.add(new Object[]{
                submissionId, customerId, employeeId, productId, productName,
                formId, formName, formType, formData, completionRate, submittedAt, createdAt
            });
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                log.info("📝 폼 제출 데이터 배치 처리: {}건 완료", (i + 1));
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("✅ 폼 제출 데이터 생성 완료: {}건", count);
        return count;
    }

    /**
     * 고객-상품 관계 데이터 생성
     */
    private int generateCustomerProducts(int count) {
        log.info("🔗 고객-상품 관계 데이터 생성 시작: {}건", count);
        
        String sql = "INSERT INTO customer_product (customer_id, product_id, product_name, " +
                    "enrollment_date, status, amount, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        List<Object[]> batchArgs = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            String customerId = "C" + String.format("%06d", ThreadLocalRandom.current().nextInt(1, 100001));
            String productId = "P" + String.format("%06d", ThreadLocalRandom.current().nextInt(1, 10001));
            String productName = generateRandomProductName();
            LocalDate enrollmentDate = LocalDate.now().minusDays(ThreadLocalRandom.current().nextInt(365));
            String status = ThreadLocalRandom.current().nextBoolean() ? "active" : "inactive";
            Long amount = (long) ThreadLocalRandom.current().nextInt(1000000, 100000000); // 100만~1억
            LocalDateTime createdAt = enrollmentDate.atStartOfDay();
            
            batchArgs.add(new Object[]{
                customerId, productId, productName, enrollmentDate, status, amount, createdAt
            });
            
            // 배치 단위로 처리 (1000건씩)
            if (batchArgs.size() >= 1000) {
                jdbcTemplate.batchUpdate(sql, batchArgs);
                batchArgs.clear();
                log.info("📝 고객-상품 관계 데이터 배치 처리: {}건 완료", (i + 1));
            }
        }
        
        // 남은 데이터 처리
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
        
        log.info("✅ 고객-상품 관계 데이터 생성 완료: {}건", count);
        return count;
    }

    // 헬퍼 메서드들
    private String generateRandomKoreanName() {
        String surname = KOREAN_SURNAMES[ThreadLocalRandom.current().nextInt(KOREAN_SURNAMES.length)];
        String givenName = KOREAN_GIVEN_NAMES[ThreadLocalRandom.current().nextInt(KOREAN_GIVEN_NAMES.length)];
        return surname + givenName;
    }

    private String generateRandomPhoneNumber() {
        return String.format("010-%04d-%04d", 
            ThreadLocalRandom.current().nextInt(1000, 10000),
            ThreadLocalRandom.current().nextInt(1000, 10000));
    }

    private LocalDate generateRandomBirthDate() {
        int year = ThreadLocalRandom.current().nextInt(1950, 2005);
        int month = ThreadLocalRandom.current().nextInt(1, 13);
        int day = ThreadLocalRandom.current().nextInt(1, 29);
        return LocalDate.of(year, month, day);
    }

    private String generateRandomAddress() {
        String[] cities = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"};
        String city = cities[ThreadLocalRandom.current().nextInt(cities.length)];
        return city + "시 " + (ThreadLocalRandom.current().nextInt(1, 26)) + "구 " + 
               "테스트동 " + (ThreadLocalRandom.current().nextInt(1, 100)) + "번지";
    }

    private Integer generateRandomIncome() {
        return ThreadLocalRandom.current().nextInt(2000, 10000) * 10000; // 2000만~1억
    }

    private Long generateRandomAssets() {
        return (long) ThreadLocalRandom.current().nextInt(10000, 100000) * 10000; // 1억~10억
    }

    private String generateRandomInvestmentGoal() {
        String[] goals = {"자금관리", "자녀교육", "주택구입", "노후준비", "투자수익"};
        return goals[ThreadLocalRandom.current().nextInt(goals.length)];
    }

    private String generateRandomRiskTolerance() {
        String[] risks = {"보수적", "안정적", "중립적", "적극적", "공격적"};
        return risks[ThreadLocalRandom.current().nextInt(risks.length)];
    }

    private String generateRandomInvestmentPeriod() {
        String[] periods = {"1년미만", "1-3년", "3-5년", "5-10년", "10년이상"};
        return periods[ThreadLocalRandom.current().nextInt(periods.length)];
    }

    private String generateRandomGender() {
        return ThreadLocalRandom.current().nextBoolean() ? "M" : "F";
    }

    private String generateRandomProductName() {
        String template = PRODUCT_TEMPLATES[ThreadLocalRandom.current().nextInt(PRODUCT_TEMPLATES.length)];
        return template + "_" + (ThreadLocalRandom.current().nextInt(1, 1000));
    }

    private String generateRandomRates() {
        return String.format("%.2f%%", ThreadLocalRandom.current().nextDouble(1.0, 5.0));
    }

    private String generateRandomProductInfo() {
        return "테스트 상품 정보 - " + UUID.randomUUID().toString().substring(0, 8);
    }

    private String generateRandomConsultationSummary() {
        String[] summaries = {
            "예금 상품 상담 - 정기예금과 적금 상품에 대해 문의하심",
            "대출 상품 상담 - 주택담보대출 조건 및 절차 안내",
            "투자 상품 상담 - 펀드 투자에 대한 위험성 설명",
            "보험 상품 상담 - 생명보험 가입 조건 상담",
            "카드 상품 상담 - 신용카드 혜택 및 연회비 안내"
        };
        return summaries[ThreadLocalRandom.current().nextInt(summaries.length)];
    }

    private String generateRandomFormName() {
        String[] formNames = {
            "대출신청서", "예금가입신청서", "적금가입신청서", "보험가입신청서",
            "카드신청서", "투자신청서", "외환거래신청서", "계좌개설신청서"
        };
        return formNames[ThreadLocalRandom.current().nextInt(formNames.length)];
    }

    private String generateRandomFormData() {
        return "{\"field1\":\"value1\",\"field2\":\"value2\",\"field3\":\"value3\"}";
    }
}
