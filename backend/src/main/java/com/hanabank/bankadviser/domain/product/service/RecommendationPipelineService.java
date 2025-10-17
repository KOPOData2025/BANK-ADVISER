package com.hanabank.bankadviser.domain.product.service;

import com.hanabank.bankadviser.domain.customer.entity.Customer;
import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import com.hanabank.bankadviser.domain.customer.repository.CustomerRepository;
import com.hanabank.bankadviser.domain.product.repository.FinancialProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class RecommendationPipelineService {

    private final CustomerRepository customerRepository;
    private final FinancialProductRepository productRepository;
    private final OpenAIService openAIService;

    /**
     * 6단계 추천 파이프라인 실행
     * 1. 음성 텍스트 분석
     * 2. 키워드 추출
     * 3. 의도 분석
     * 4. 고객 프로필 분석
     * 5. 상품 매칭 및 점수 계산
     * 6. 추천 결과 생성
     */
    public RecommendationResult executeRecommendationPipeline(String customerId, String voiceText) {
        log.info("🚀 추천 파이프라인 시작 - 고객ID: {}, 음성텍스트: {}", customerId, voiceText);

        try {
            // 1-3단계: OpenAI API 호출을 병렬로 실행하여 성능 최적화
            CompletableFuture<OpenAIService.VoiceAnalysisResult> voiceAnalysisFuture = 
                CompletableFuture.supplyAsync(() -> openAIService.analyzeVoiceText(voiceText));
            CompletableFuture<List<String>> keywordsFuture = 
                CompletableFuture.supplyAsync(() -> openAIService.extractKeywords(voiceText));
            CompletableFuture<CustomerProfile> customerProfileFuture = 
                CompletableFuture.supplyAsync(() -> getCustomerProfileFromDB(customerId));
            
            // 모든 비동기 작업 완료 대기
            CompletableFuture.allOf(voiceAnalysisFuture, keywordsFuture, customerProfileFuture).join();
            
            OpenAIService.VoiceAnalysisResult voiceAnalysis = voiceAnalysisFuture.get();
            List<String> keywords = keywordsFuture.get();
            CustomerProfile customerProfile = customerProfileFuture.get();
            
            // 의도 분석은 키워드가 필요하므로 순차 실행
            OpenAIService.IntentAnalysis intentAnalysis = openAIService.analyzeIntent(voiceText, keywords);
            
            log.info("1-4단계 완료 - 병렬 처리된 분석: voice={}, keywords={}, profile={}, intent={}", 
                voiceAnalysis, keywords, customerProfile, intentAnalysis);

            // 5단계: 상품 매칭 및 점수 계산 (실제 DB 기반)
            List<ProductRecommendation> productRecommendations = matchProductsWithOpenAI(intentAnalysis, customerProfile, keywords);
            log.info("5단계 완료 - 상품 추천: {}개", productRecommendations.size());

            // 6단계: 추천 결과 생성
            RecommendationResult result = generateRecommendationResult(
                customerId, voiceText, intentAnalysis, productRecommendations);
            log.info("6단계 완료 - 최종 추천 결과 생성");

            return result;

        } catch (Exception e) {
            log.error("추천 파이프라인 실행 중 오류 발생", e);
            return createErrorResult(customerId, "추천 처리 중 오류가 발생했습니다.");
        }
    }

    // 하드코딩된 메서드들 제거됨 - OpenAI 서비스 사용

    // analyzeCustomerProfile 메서드 제거됨 - getCustomerProfileFromDB 사용

    // 기존 하드코딩된 matchProductsAndCalculateScores 메서드 제거됨 - matchProductsWithOpenAI 사용

    /**
     * 상품 점수 계산
     */
    private double calculateProductScore(FinancialProduct product, OpenAIService.IntentAnalysis intentAnalysis, 
                                       CustomerProfile customerProfile, List<String> keywords) {
        double score = 0.0;

        // 1. 의도 매칭 점수 (40%)
        score += calculateIntentScore(product, intentAnalysis) * 0.4;

        // 2. 키워드 매칭 점수 (30%)
        score += calculateKeywordScore(product, keywords) * 0.3;

        // 3. 고객 프로필 매칭 점수 (30%)
        score += calculateProfileScore(product, customerProfile) * 0.3;

        return Math.min(score, 1.0); // 최대 1.0으로 제한
    }

    private double calculateIntentScore(FinancialProduct product, OpenAIService.IntentAnalysis intentAnalysis) {
        String intent = intentAnalysis.getIntent();
        String productType = product.getProductType();

        if (intent.contains("대출") && productType.equals("대출")) {
            if (intent.contains("주택") && product.getProductName().contains("주택")) {
                return 0.9;
            } else if (intent.contains("전세") && product.getProductName().contains("전세")) {
                return 0.9;
            } else {
                return 0.7;
            }
        } else if (intent.contains("적금") && productType.equals("적금")) {
            if (intent.contains("교육") && product.getProductName().contains("아이")) {
                return 0.9;
            } else if (intent.contains("급여") && product.getProductName().contains("급여")) {
                return 0.9;
            } else {
                return 0.7;
            }
        } else if (intent.contains("투자") && productType.equals("투자")) {
            return 0.8;
        } else if (intent.contains("예금") && productType.equals("예금")) {
            return 0.8;
        }

        return 0.2; // 기본 점수 (적절한 수준)
    }

    private double calculateKeywordScore(FinancialProduct product, List<String> keywords) {
        double score = 0.2; // 기본 점수 (적절한 수준)
        String productName = product.getProductName().toLowerCase();
        String description = product.getDescription() != null ? product.getDescription().toLowerCase() : "";

        for (String keyword : keywords) {
            if (productName.contains(keyword.toLowerCase()) || description.contains(keyword.toLowerCase())) {
                score += 0.3;
            }
        }

        return Math.min(score, 1.0);
    }

    private double calculateProfileScore(FinancialProduct product, CustomerProfile customerProfile) {
        double score = 0.4; // 기본 점수 (적절한 수준)

        // 고객의 금융 건강도에 따른 점수 조정
        if (customerProfile.getFinancialHealthScore() > 70) {
            score += 0.2; // 금융 건강도가 높으면 더 다양한 상품 추천
        }

        // 월소득에 따른 상품 적합성
        double monthlyIncome = customerProfile.getMonthlyIncome();
        double minAmount = product.getMinAmount() != null ? product.getMinAmount().doubleValue() : 0.0;
        
        if (monthlyIncome >= minAmount * 0.1) { // 월소득이 최소금액의 10% 이상
            score += 0.2;
        }

        // 위험성향에 따른 상품 매칭
        String riskTolerance = customerProfile.getRiskTolerance();
        if (product.getProductType().equals("투자") && riskTolerance.equals("높음")) {
            score += 0.2;
        } else if (product.getProductType().equals("적금") && riskTolerance.equals("낮음")) {
            score += 0.2;
        }

        return Math.min(score, 1.0);
    }

    // 하드코딩된 추천 이유 생성 메서드 제거됨 - OpenAI 서비스 사용

    /**
     * 6단계: 추천 결과 생성
     */
    private RecommendationResult generateRecommendationResult(String customerId, String voiceText,
            OpenAIService.IntentAnalysis intentAnalysis, List<ProductRecommendation> productRecommendations) {
        
        return RecommendationResult.builder()
            .sessionId("SESSION_" + customerId + "_" + System.currentTimeMillis())
            .customerId(customerId)
            .originalVoiceText(voiceText)
            .intentAnalysis(intentAnalysis)
            .recommendations(productRecommendations)
            .confidence(calculateOverallConfidence(intentAnalysis, productRecommendations))
            .timestamp(LocalDateTime.now())
            .build();
    }

    private double calculateOverallConfidence(OpenAIService.IntentAnalysis intentAnalysis, 
                                            List<ProductRecommendation> recommendations) {
        if (recommendations.isEmpty()) {
            return 0.0;
        }

        double intentConfidence = intentAnalysis.getConfidence();
        double avgProductScore = recommendations.stream()
            .mapToDouble(ProductRecommendation::getScore)
            .average()
            .orElse(0.0);

        return (intentConfidence + avgProductScore) / 2.0;
    }

    /**
     * 실제 DB에서 고객 프로필 조회
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED, readOnly = true)
    private CustomerProfile getCustomerProfileFromDB(String customerId) {
        try {
            log.info("🔍 고객 프로필 DB 조회 시작: {}", customerId);
            
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                log.info("✅ 고객 프로필 DB 조회 성공: {}", customer.getName());
                
                return CustomerProfile.builder()
                    .customerId(customerId)
                    .name(customer.getName())
                    .age(calculateAge(customer.getDateOfBirth()))
                    .monthlyIncome(customer.getMonthlyIncome() != null ? customer.getMonthlyIncome().doubleValue() : 3000000.0)
                    .totalAssets(customer.getTotalAssets() != null ? customer.getTotalAssets().doubleValue() : 50000000.0)
                    .riskTolerance(customer.getRiskTolerance() != null ? customer.getRiskTolerance() : "보통")
                    .investmentGoal(customer.getInvestmentGoal() != null ? customer.getInvestmentGoal() : "일반저축")
                    .financialHealthScore(calculateFinancialHealthScore(customer))
                    .salaryAccount(customer.getSalaryAccount())
                    .build();
            } else {
                log.warn("⚠️ 고객 프로필 DB 조회 실패, 기본값 사용: {}", customerId);
                return createDefaultCustomerProfile(customerId);
            }
            
        } catch (Exception e) {
            log.error("❌ 고객 프로필 DB 조회 중 오류 발생, 기본값 사용: {}", e.getMessage());
            return createDefaultCustomerProfile(customerId);
        }
    }

    /**
     * 기본 고객 프로필 생성 (DB 조회 실패 시)
     */
    private CustomerProfile createDefaultCustomerProfile(String customerId) {
        return CustomerProfile.builder()
            .customerId(customerId)
            .name("고객")
            .age(35)
            .monthlyIncome(3000000.0)
            .totalAssets(50000000.0)
            .riskTolerance("보통")
            .investmentGoal("일반저축")
            .financialHealthScore(70)
            .salaryAccount(false)
            .build();
    }

    /**
     * 고객의 재정 건강 점수 계산
     */
    private int calculateFinancialHealthScore(Customer customer) {
        int score = 50; // 기본 점수
        
        // 월수입 기준 점수 조정
        if (customer.getMonthlyIncome() != null) {
            double monthlyIncome = customer.getMonthlyIncome().doubleValue();
            if (monthlyIncome >= 5000000) score += 20;
            else if (monthlyIncome >= 3000000) score += 10;
            else if (monthlyIncome >= 2000000) score += 5;
        }
        
        // 총자산 기준 점수 조정
        if (customer.getTotalAssets() != null) {
            double totalAssets = customer.getTotalAssets().doubleValue();
            if (totalAssets >= 100000000) score += 20;
            else if (totalAssets >= 50000000) score += 10;
            else if (totalAssets >= 20000000) score += 5;
        }
        
        // 급여통장 여부
        if (customer.getSalaryAccount() != null && customer.getSalaryAccount()) {
            score += 10;
        }
        
        return Math.min(score, 100); // 최대 100점
    }

    /**
     * 생년월일로부터 나이 계산
     */
    private int calculateAge(java.time.LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 35; // 기본값
        }
        
        java.time.LocalDate now = java.time.LocalDate.now();
        int age = now.getYear() - dateOfBirth.getYear();
        
        // 생일이 지나지 않았으면 1살 빼기
        if (now.getDayOfYear() < dateOfBirth.getDayOfYear()) {
            age--;
        }
        
        return age;
    }

    /**
     * OpenAI 기반 상품 매칭 및 점수 계산
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED, readOnly = true)
    private List<ProductRecommendation> matchProductsWithOpenAI(OpenAIService.IntentAnalysis intentAnalysis, CustomerProfile customerProfile, List<String> keywords) {
        try {
            log.info("🔍 OpenAI 기반 상품 매칭 시작 - 의도: {}", intentAnalysis.getIntent());
            
            // 실제 DB에서 상품 조회
            List<FinancialProduct> products = productRepository.findBySalesStatusOrderByBaseRateDesc("판매중", 
                org.springframework.data.domain.PageRequest.of(0, 20));
            
            if (products.isEmpty()) {
                log.warn("⚠️ DB에서 상품 조회 실패, 기본 추천 사용");
                return createDefaultRecommendations(intentAnalysis, customerProfile);
            }
            
            log.info("✅ DB에서 {}개 상품 조회 성공", products.size());
            
            List<ProductRecommendation> recommendations = new ArrayList<>();
            
            for (FinancialProduct product : products) {
                double score = calculateProductScore(product, intentAnalysis, customerProfile, keywords);
                
                if (score > 0.25) { // 25% 이상 매칭되는 상품만 추천 (적절한 품질)
                    String reason = openAIService.generateRecommendationReason(
                        product.getProductName(), 
                        customerProfile.toString(), 
                        intentAnalysis.getIntent()
                    );
                    
                    ProductRecommendation recommendation = ProductRecommendation.builder()
                        .productId(product.getProductId())
                        .productName(product.getProductName())
                        .productType(product.getProductType())
                        .description(product.getDescription())
                        .score(score)
                        .reason(reason)
                        .interestRate(product.getBaseRate() != null ? product.getBaseRate().doubleValue() : 0.0)
                        .minAmount(product.getMinAmount() != null ? product.getMinAmount().doubleValue() : 0.0)
                        .maxAmount(product.getMaxAmount() != null ? product.getMaxAmount().doubleValue() : 0.0)
                        .build();
                    
                    recommendations.add(recommendation);
                }
            }
            
            // 점수 순으로 정렬하고 상위 3개만 반환
            return recommendations.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(3)
                .collect(Collectors.toList());
            
        } catch (Exception e) {
            log.error("❌ OpenAI 기반 상품 매칭 중 오류 발생, 기본 추천 사용: {}", e.getMessage());
            return createDefaultRecommendations(intentAnalysis, customerProfile);
        }
    }

    /**
     * DB 연결 문제 시 기본 추천 상품 생성
     */
    private List<ProductRecommendation> createDefaultRecommendations(OpenAIService.IntentAnalysis intentAnalysis, CustomerProfile customerProfile) {
        List<ProductRecommendation> defaultRecommendations = new ArrayList<>();
        
        // 의도에 따른 기본 상품 추천
        String intent = intentAnalysis.getIntent();
        
        if (intent.contains("대출")) {
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("LOAN001")
                .productName("하나주택담보대출")
                .productType("대출")
                .description("주택 구매를 위한 담보대출 상품")
                .score(0.9)
                .reason("주택 구매 목적에 최적화된 대출 상품입니다.")
                .interestRate(3.5)
                .minAmount(10000000.0)
                .maxAmount(500000000.0)
                .build());
                
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("LOAN002")
                .productName("하나전세자금대출")
                .productType("대출")
                .description("전세 자금 마련을 위한 대출 상품")
                .score(0.8)
                .reason("전세 자금 마련에 적합한 대출 상품입니다.")
                .interestRate(4.2)
                .minAmount(5000000.0)
                .maxAmount(200000000.0)
                .build());
        }
        
        if (intent.contains("적금") || intent.contains("예금")) {
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("SAVE001")
                .productName("하나정기적금")
                .productType("적금")
                .description("안정적인 자산 형성을 위한 정기적금")
                .score(0.9)
                .reason("안정적인 저축 목적에 적합한 상품입니다.")
                .interestRate(3.8)
                .minAmount(100000.0)
                .maxAmount(10000000.0)
                .build());
                
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("SAVE002")
                .productName("하나자유적금")
                .productType("적금")
                .description("자유롭게 입금할 수 있는 적금 상품")
                .score(0.8)
                .reason("유연한 입금 방식으로 부담 없는 저축이 가능합니다.")
                .interestRate(3.2)
                .minAmount(50000.0)
                .maxAmount(5000000.0)
                .build());
        }
        
        if (intent.contains("투자") || intent.contains("펀드")) {
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("FUND001")
                .productName("하나글로벌주식형펀드")
                .productType("펀드")
                .description("글로벌 주식에 투자하는 펀드")
                .score(0.9)
                .reason("글로벌 시장 분산 투자로 안정적인 수익을 추구합니다.")
                .interestRate(0.0)
                .minAmount(100000.0)
                .maxAmount(100000000.0)
                .build());
        }
        
        // 기본 상품이 없으면 일반 상품 추천
        if (defaultRecommendations.isEmpty()) {
            defaultRecommendations.add(ProductRecommendation.builder()
                .productId("GENERAL001")
                .productName("하나통합상품")
                .productType("종합")
                .description("다양한 금융 서비스를 제공하는 통합 상품")
                .score(0.7)
                .reason("고객님의 다양한 금융 니즈를 충족할 수 있는 상품입니다.")
                .interestRate(3.0)
                .minAmount(100000.0)
                .maxAmount(10000000.0)
                .build());
        }
        
        return defaultRecommendations.stream()
            .limit(3)
            .collect(Collectors.toList());
    }

    private RecommendationResult createErrorResult(String customerId, String errorMessage) {
        return RecommendationResult.builder()
            .sessionId("ERROR_" + customerId + "_" + System.currentTimeMillis())
            .customerId(customerId)
            .originalVoiceText("")
            .intentAnalysis(null)
            .recommendations(new ArrayList<>())
            .confidence(0.0)
            .timestamp(LocalDateTime.now())
            .errorMessage(errorMessage)
            .build();
    }

    // VoiceAnalysisResult와 IntentAnalysis는 OpenAIService에서 제공

    @lombok.Data
    @lombok.Builder
    public static class CustomerProfile {
        private String customerId;
        private String name;
        private int age;
        private double monthlyIncome;
        private double totalAssets;
        private String riskTolerance;
        private String investmentGoal;
        private int financialHealthScore;
        private boolean salaryAccount;
    }

    @lombok.Data
    @lombok.Builder
    public static class ProductRecommendation {
        private String productId;
        private String productName;
        private String productType;
        private String description;
        private double score;
        private String reason;
        private double interestRate;
        private double minAmount;
        private double maxAmount;
    }

    @lombok.Data
    @lombok.Builder
    public static class RecommendationResult {
        private String sessionId;
        private String customerId;
        private String originalVoiceText;
        private OpenAIService.IntentAnalysis intentAnalysis;
        private List<ProductRecommendation> recommendations;
        private double confidence;
        private LocalDateTime timestamp;
        private String errorMessage;
    }
}
