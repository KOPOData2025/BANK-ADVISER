package com.hanabank.bankadviser.domain.consultation.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import com.hanabank.bankadviser.domain.consultation.service.SupabaseApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://v0-bankteller.vercel.app", "http://localhost:3000"}, allowCredentials = "false")
public class ConsultationController {
    
    private final SupabaseApiService supabaseApiService;
    
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSession(@RequestBody Map<String, Object> request) {
        try {
            String employeeId = (String) request.get("employeeId");
            String customerId = (String) request.get("customerId");
            
            log.info("상담 세션 생성 요청 - employeeId: {}, customerId: {}", employeeId, customerId);
            
            // 세션 ID 생성 
            String sessionId = "session_" + employeeId + "_" + customerId + "_" + System.currentTimeMillis();
            
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("sessionId", sessionId);
            sessionData.put("employeeId", employeeId);
            sessionData.put("customerId", customerId);
            sessionData.put("createdAt", LocalDateTime.now());
            sessionData.put("status", "active");
            
            return ResponseEntity.ok(ApiResponse.success("상담 세션이 생성되었습니다.", sessionData));
            
        } catch (Exception e) {
            log.error("상담 세션 생성 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상담 세션 생성에 실패했습니다.")
            );
        }
    }
    
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSession(@PathVariable String sessionId) {
        try {
            log.info("상담 세션 조회 요청 - sessionId: {}", sessionId);
            
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("sessionId", sessionId);
            sessionData.put("status", "active");
            sessionData.put("createdAt", LocalDateTime.now());
            
            return ResponseEntity.ok(ApiResponse.success("상담 세션 조회 성공", sessionData));
            
        } catch (Exception e) {
            log.error("상담 세션 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상담 세션 조회에 실패했습니다.")
            );
        }
    }
    
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<String>> endSession(@PathVariable String sessionId) {
        try {
            log.info("상담 세션 종료 요청 - sessionId: {}", sessionId);
            
            return ResponseEntity.ok(ApiResponse.success("상담 세션이 종료되었습니다.", sessionId));
            
        } catch (Exception e) {
            log.error("상담 세션 종료 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상담 세션 종료에 실패했습니다.")
            );
        }
    }
    
    /**
     * 고객별 상담 세션 목록 조회
     */
    @GetMapping("/customers/{customerId}/sessions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerConsultationSessions(@PathVariable String customerId) {
        try {
            log.info("고객 상담 세션 목록 조회 요청 - customerId: {}", customerId);
            
            // Supabase에서 상담 세션 목록 조회
            Map<String, Object> result = supabaseApiService.getConsultationSessions(customerId);
            
            if ((Boolean) result.get("success")) {
                List<Map<String, Object>> sessions = (List<Map<String, Object>>) result.get("data");
                
                // 데이터가 없거나 비어있으면 테스트용 더미 데이터 제공
                if (sessions == null || sessions.isEmpty()) {
                    log.info("상담 세션 데이터가 없어서 테스트용 더미 데이터를 제공합니다.");
                    
                    List<Map<String, Object>> dummySessions = new ArrayList<>();
                    
                    // 더미 상담 세션 1
                    Map<String, Object> session1 = new HashMap<>();
                    session1.put("session_id", "session_" + customerId + "_001");
                    session1.put("customer_id", customerId);
                    session1.put("session_start_time", "2024-10-01T10:00:00Z");
                    session1.put("session_end_time", "2024-10-01T10:30:00Z");
                    session1.put("summary", "예금 상품 상담 - 정기예금과 적금 상품에 대해 문의하심");
                    session1.put("status", "completed");
                    dummySessions.add(session1);
                    
                    // 더미 상담 세션 2
                    Map<String, Object> session2 = new HashMap<>();
                    session2.put("session_id", "session_" + customerId + "_002");
                    session2.put("customer_id", customerId);
                    session2.put("session_start_time", "2024-09-28T14:30:00Z");
                    session2.put("session_end_time", "2024-09-28T15:15:00Z");
                    session2.put("summary", "대출 상품 상담 - 주택담보대출 조건 및 금리 문의");
                    session2.put("status", "completed");
                    dummySessions.add(session2);
                    
                    // 더미 상담 세션 3
                    Map<String, Object> session3 = new HashMap<>();
                    session3.put("session_id", "session_" + customerId + "_003");
                    session3.put("customer_id", customerId);
                    session3.put("session_start_time", "2024-09-25T09:15:00Z");
                    session3.put("session_end_time", "2024-09-25T09:45:00Z");
                    session3.put("summary", "카드 상품 상담 - 신용카드 발급 및 혜택 문의");
                    session3.put("status", "completed");
                    dummySessions.add(session3);
                    
                    result.put("data", dummySessions);
                    result.put("count", dummySessions.size());
                }
                
                return ResponseEntity.ok(ApiResponse.success("고객 상담 세션 목록 조회 성공", result));
            } else {
                return ResponseEntity.status(500).body(
                    ApiResponse.error("상담 세션 목록 조회에 실패했습니다: " + result.get("error"))
                );
            }
            
        } catch (Exception e) {
            log.error("고객 상담 세션 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상담 세션 목록 조회에 실패했습니다.")
            );
        }
    }

    /**
     * 상담 세션 상세 내용 조회
     */
    @GetMapping("/sessions/{sessionId}/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationSessionDetails(@PathVariable String sessionId) {
        try {
            log.info("상담 세션 상세 조회 요청 - sessionId: {}", sessionId);
            
            // Supabase에서 상담 세션 상세 조회
            Map<String, Object> result = supabaseApiService.getConsultationSessionDetails(sessionId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(ApiResponse.success("상담 세션 상세 조회 성공", result));
            } else {
                return ResponseEntity.status(500).body(
                    ApiResponse.error("상담 세션 상세 조회에 실패했습니다: " + result.get("error"))
                );
            }
            
        } catch (Exception e) {
            log.error("상담 세션 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상담 세션 상세 조회에 실패했습니다.")
            );
        }
    }
}


