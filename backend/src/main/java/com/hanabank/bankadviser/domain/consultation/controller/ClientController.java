package com.hanabank.bankadviser.domain.consultation.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
@Slf4j
public class ClientController {

    // 태블릿 상태 확인
    @GetMapping("/health")
    public ApiResponse<?> getHealth() {
        return ApiResponse.success("태블릿 서비스 정상", Map.of("status", "healthy"));
    }

    // 세션 연결 상태 확인
    @GetMapping("/session/{sessionId}/status")
    public ApiResponse<?> getSessionStatus(@PathVariable String sessionId) {
        try {
            return ApiResponse.success("세션 상태 조회 성공", Map.of("sessionId", sessionId, "status", "active"));
        } catch (Exception e) {
            log.error("세션 상태 조회 실패", e);
            return ApiResponse.error("세션 상태 조회에 실패했습니다.");
        }
    }
}


