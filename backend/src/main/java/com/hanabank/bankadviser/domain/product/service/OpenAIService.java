package com.hanabank.bankadviser.domain.product.service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    private OpenAiService openAiService;

    /**
     * OpenAI 서비스 초기화
     */
    private OpenAiService getOpenAiService() {
        if (openAiService == null && isAvailable()) {
            openAiService = new OpenAiService(apiKey, Duration.ofSeconds(60));
        }
        return openAiService;
    }

    /**
     * 음성 텍스트 분석
     */
    public VoiceAnalysisResult analyzeVoiceText(String voiceText) {
        try {
            log.info("🎤 OpenAI 음성 텍스트 분석 시작: {}", voiceText);

            List<ChatMessage> messages = Arrays.asList(
                new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                    "당신은 한국어 음성 인식 전문가입니다. 주어진 텍스트를 분석하여 " +
                    "신뢰도, 언어, 타임스탬프를 포함한 분석 결과를 JSON 형태로 반환해주세요. " +
                    "응답 형식: {\"confidence\": 0.95, \"language\": \"ko\", \"timestamp\": \"2024-01-01T00:00:00\"}"),
                new ChatMessage(ChatMessageRole.USER.value(), voiceText)
            );

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-3.5-turbo")
                .messages(messages)
                .maxTokens(200)
                .temperature(0.1)
                .build();

            String response = getOpenAiService().createChatCompletion(request)
                .getChoices().get(0).getMessage().getContent();

            log.info("✅ OpenAI 음성 분석 완료: {}", response);

            // JSON 파싱 (간단한 파싱)
            double confidence = 0.95;
            String language = "ko";
            
            if (response.contains("\"confidence\"")) {
                try {
                    String confStr = response.substring(response.indexOf("\"confidence\":") + 13);
                    confStr = confStr.substring(0, confStr.indexOf(","));
                    confidence = Double.parseDouble(confStr.trim());
                } catch (Exception e) {
                    log.warn("신뢰도 파싱 실패, 기본값 사용: {}", e.getMessage());
                }
            }

            return VoiceAnalysisResult.builder()
                .originalText(voiceText)
                .confidence(confidence)
                .language(language)
                .timestamp(java.time.LocalDateTime.now())
                .build();

        } catch (Exception e) {
            log.error("OpenAI 음성 분석 실패, 기본값 반환: {}", e.getMessage());
            return VoiceAnalysisResult.builder()
                .originalText(voiceText)
                .confidence(0.8)
                .language("ko")
                .timestamp(java.time.LocalDateTime.now())
                .build();
        }
    }

    /**
     * 키워드 추출
     */
    public List<String> extractKeywords(String voiceText) {
        try {
            log.info("🔍 OpenAI 키워드 추출 시작: {}", voiceText);

            List<ChatMessage> messages = Arrays.asList(
                new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                    "당신은 금융 상담 전문가입니다. 주어진 고객의 음성 텍스트에서 " +
                    "금융 상품, 금리, 목적, 금액 등과 관련된 핵심 키워드들을 추출해주세요. " +
                    "키워드는 쉼표로 구분하여 나열해주세요. 예: 대출,주택,금리,높은금리"),
                new ChatMessage(ChatMessageRole.USER.value(), voiceText)
            );

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-3.5-turbo")
                .messages(messages)
                .maxTokens(150)
                .temperature(0.1)
                .build();

            String response = getOpenAiService().createChatCompletion(request)
                .getChoices().get(0).getMessage().getContent();

            log.info("✅ OpenAI 키워드 추출 완료: {}", response);

            // 키워드 파싱
            List<String> keywords = new ArrayList<>();
            if (response != null && !response.trim().isEmpty()) {
                String[] keywordArray = response.split(",");
                for (String keyword : keywordArray) {
                    String trimmed = keyword.trim();
                    if (!trimmed.isEmpty()) {
                        keywords.add(trimmed);
                    }
                }
            }

            return keywords;

        } catch (Exception e) {
            log.error("OpenAI 키워드 추출 실패, 기본 키워드 반환: {}", e.getMessage());
            return getDefaultKeywords(voiceText);
        }
    }

    /**
     * 의도 분석
     */
    public IntentAnalysis analyzeIntent(String voiceText, List<String> keywords) {
        try {
            log.info("🎯 OpenAI 의도 분석 시작: {}", voiceText);

            String keywordStr = String.join(", ", keywords);
            
            List<ChatMessage> messages = Arrays.asList(
                new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                    "당신은 은행 상담원입니다. 고객의 음성 텍스트와 키워드를 분석하여 " +
                    "고객의 의도를 파악해주세요. " +
                    "의도 유형: 주택대출문의, 전세대출문의, 대출상품문의, 교육적금문의, " +
                    "급여적금문의, 적금상품문의, 투자상품문의, 예금상품문의, 일반상담 " +
                    "응답 형식: {\"intent\": \"주택대출문의\", \"confidence\": 0.9}"),
                new ChatMessage(ChatMessageRole.USER.value(), 
                    "음성텍스트: " + voiceText + "\n키워드: " + keywordStr)
            );

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-3.5-turbo")
                .messages(messages)
                .maxTokens(100)
                .temperature(0.1)
                .build();

            String response = getOpenAiService().createChatCompletion(request)
                .getChoices().get(0).getMessage().getContent();

            log.info("✅ OpenAI 의도 분석 완료: {}", response);

            // 의도 파싱
            String intent = "일반상담";
            double confidence = 0.5;

            if (response.contains("\"intent\"")) {
                try {
                    String intentStr = response.substring(response.indexOf("\"intent\":\"") + 10);
                    intentStr = intentStr.substring(0, intentStr.indexOf("\""));
                    intent = intentStr;
                } catch (Exception e) {
                    log.warn("의도 파싱 실패, 기본값 사용: {}", e.getMessage());
                }
            }

            if (response.contains("\"confidence\"")) {
                try {
                    String confStr = response.substring(response.indexOf("\"confidence\":") + 13);
                    confStr = confStr.substring(0, confStr.indexOf("}"));
                    confidence = Double.parseDouble(confStr.trim());
                } catch (Exception e) {
                    log.warn("신뢰도 파싱 실패, 기본값 사용: {}", e.getMessage());
                }
            }

            return IntentAnalysis.builder()
                .intent(intent)
                .confidence(confidence)
                .keywords(keywords)
                .timestamp(java.time.LocalDateTime.now())
                .build();

        } catch (Exception e) {
            log.error("OpenAI 의도 분석 실패, 기본 의도 반환: {}", e.getMessage());
            return IntentAnalysis.builder()
                .intent("일반상담")
                .confidence(0.5)
                .keywords(keywords)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        }
    }

    /**
     * 추천 이유 생성
     */
    public String generateRecommendationReason(String productName, String customerProfile, String intent) {
        try {
            log.info("💡 OpenAI 추천 이유 생성 시작: {}", productName);

            List<ChatMessage> messages = Arrays.asList(
                new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                    "당신은 은행 상담원입니다. 고객의 프로필과 의도를 바탕으로 " +
                    "특정 금융 상품을 추천하는 이유를 간결하고 설득력 있게 설명해주세요. " +
                    "한 문장으로 요약해주세요."),
                new ChatMessage(ChatMessageRole.USER.value(), 
                    "상품명: " + productName + "\n고객프로필: " + customerProfile + "\n의도: " + intent)
            );

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-3.5-turbo")
                .messages(messages)
                .maxTokens(100)
                .temperature(0.3)
                .build();

            String response = getOpenAiService().createChatCompletion(request)
                .getChoices().get(0).getMessage().getContent();

            log.info("✅ OpenAI 추천 이유 생성 완료: {}", response);

            return response != null ? response.trim() : "고객님의 요구사항에 적합한 상품입니다.";

        } catch (Exception e) {
            log.error("OpenAI 추천 이유 생성 실패, 기본 이유 반환: {}", e.getMessage());
            return "고객님의 요구사항에 적합한 상품입니다.";
        }
    }

    /**
     * 기본 키워드 추출 (OpenAI 실패 시)
     */
    private List<String> getDefaultKeywords(String voiceText) {
        List<String> keywords = new ArrayList<>();
        String text = voiceText.toLowerCase();

        if (text.contains("대출")) keywords.add("대출");
        if (text.contains("예금")) keywords.add("예금");
        if (text.contains("적금")) keywords.add("적금");
        if (text.contains("투자")) keywords.add("투자");
        if (text.contains("펀드")) keywords.add("펀드");
        if (text.contains("보험")) keywords.add("보험");
        if (text.contains("카드")) keywords.add("카드");
        if (text.contains("금리")) keywords.add("금리");
        if (text.contains("주택")) keywords.add("주택");
        if (text.contains("전세")) keywords.add("전세");

        return keywords;
    }

    /**
     * OpenAI 서비스 사용 가능 여부 확인
     */
    public boolean isAvailable() {
        try {
            return apiKey != null && !apiKey.equals("your-openai-api-key-here") && !apiKey.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    // 내부 클래스들
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VoiceAnalysisResult {
        private String originalText;
        private double confidence;
        private String language;
        private java.time.LocalDateTime timestamp;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class IntentAnalysis {
        private String intent;
        private double confidence;
        private List<String> keywords;
        private java.time.LocalDateTime timestamp;
    }
}
