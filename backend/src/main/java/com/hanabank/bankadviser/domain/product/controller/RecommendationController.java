package com.hanabank.bankadviser.domain.product.controller;

import com.hanabank.bankadviser.domain.product.service.RecommendationPipelineService;
import com.hanabank.bankadviser.domain.consultation.controller.WebSocketController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationPipelineService recommendationPipelineService;
    private final WebSocketController webSocketController;

    /**
     * 음성 기반 상품 추천 API
     */
    @PostMapping("/pipeline")
    public ResponseEntity<?> getRecommendations(@RequestBody RecommendationRequest request) {
        try {
            log.info("🎤 추천 요청 받음 - 고객ID: {}, 음성텍스트: {}", request.getCustomerId(), request.getVoiceText());

            // 6단계 추천 파이프라인 실행
            RecommendationPipelineService.RecommendationResult result = 
                recommendationPipelineService.executeRecommendationPipeline(
                    request.getCustomerId(), 
                    request.getVoiceText()
                );

            // WebSocket으로 실시간 추천 결과 전송
            sendRecommendationToWebSocket(result);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("추천 API 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "추천 처리 중 오류가 발생했습니다.", "details", e.getMessage()));
        }
    }

    /**
     * WebSocket을 통해 추천 결과를 실시간으로 전송
     */
    private void sendRecommendationToWebSocket(RecommendationPipelineService.RecommendationResult result) {
        try {
            // WebSocket 메시지 구성
            Map<String, Object> message = Map.of(
                "sessionId", result.getSessionId(),
                "customerId", result.getCustomerId(),
                "intent", result.getIntentAnalysis() != null ? result.getIntentAnalysis().getIntent() : "일반상담",
                "confidence", result.getConfidence(),
                "recommendations", result.getRecommendations(),
                "timestamp", result.getTimestamp()
            );

            // WebSocket을 통해 실시간 전송
            webSocketController.sendRecommendationResult(result.getCustomerId(), message);
            
            log.info("📡 추천 결과 WebSocket 전송 완료 - 세션ID: {}", result.getSessionId());

        } catch (Exception e) {
            log.error("WebSocket 전송 중 오류 발생", e);
        }
    }

    /**
     * 추천 요청 DTO
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RecommendationRequest {
        private String customerId;
        private String voiceText;
    }
}
