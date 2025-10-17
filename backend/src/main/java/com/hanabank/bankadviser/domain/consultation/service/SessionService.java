package com.hanabank.bankadviser.domain.consultation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    // 활성 세션 관리 (employeeId -> sessionId)
    private final Map<String, String> employeeSessions = new ConcurrentHashMap<>();
    
    // 세션별 참가자 관리 (sessionId -> {employee, tablet})
    private final Map<String, Map<String, Object>> sessionParticipants = new ConcurrentHashMap<>();
    
    /**
     * 행원이 로그인할 때 새 세션 생성
     */
    public String createEmployeeSession(String employeeId, String employeeName) {
        String sessionId = generateSessionId(employeeId);
        
        // 기존 세션이 있다면 정리
        String oldSessionId = employeeSessions.get(employeeId);
        if (oldSessionId != null) {
            cleanupSession(oldSessionId);
        }
        
        employeeSessions.put(employeeId, sessionId);
        
        // 세션 참가자 정보 초기화
        Map<String, Object> participants = new HashMap<>();
        participants.put("employee", Map.of(
            "id", employeeId,
            "name", employeeName,
            "type", "employee",
            "connected", true
        ));
        sessionParticipants.put(sessionId, participants);
        
        log.info("새 세션 생성 - employeeId: {}, sessionId: {}", employeeId, sessionId);
        
        return sessionId;
    }
    
    /**
     * 행원 ID로 세션 찾기 (태블릿에서 사용)
     */
    public String findSessionByEmployeeId(String employeeId) {
        return employeeSessions.get(employeeId);
    }
    
    /**
     * 태블릿이 세션에 참여 (행원 ID 또는 세션 ID 모두 지원)
     */
    public boolean joinTabletToSession(String sessionIdOrEmployeeId) {
        String actualSessionId = sessionIdOrEmployeeId;
        
        // 먼저 세션 ID로 직접 찾아보기
        Map<String, Object> participants = sessionParticipants.get(sessionIdOrEmployeeId);
        
        // 없으면 행원 ID로 세션 찾기
        if (participants == null) {
            actualSessionId = findSessionByEmployeeId(sessionIdOrEmployeeId);
            if (actualSessionId != null) {
                participants = sessionParticipants.get(actualSessionId);
            }
        }
        
        // 여전히 없으면 새 세션 생성 (고정 세션 ID 지원)
        if (participants == null) {
            log.info("새 세션 생성 - sessionId: {}", sessionIdOrEmployeeId);
            actualSessionId = sessionIdOrEmployeeId;
            participants = new HashMap<>();
            participants.put("session_created", Map.of(
                "timestamp", System.currentTimeMillis(),
                "type", "tablet-initiated"
            ));
            sessionParticipants.put(actualSessionId, participants);
        }
        
        // 태블릿 정보 추가
        participants.put("tablet", Map.of(
            "type", "customer-tablet",
            "connected", true,
            "joinedAt", System.currentTimeMillis()
        ));
        
        // 행원에게 태블릿 연결 알림
        notifyParticipants(actualSessionId, "tablet-connected", Map.of(
            "message", "고객 태블릿이 연결되었습니다.",
            "timestamp", System.currentTimeMillis()
        ));
        
        log.info("태블릿이 세션에 참여 - 실제 sessionId: {}, 입력값: {}", actualSessionId, sessionIdOrEmployeeId);
        return true;
    }
    
    /**
     * 행원 ID로 세션 ID 조회
     */
    public String getSessionByEmployee(String employeeId) {
        return employeeSessions.get(employeeId);
    }
    
    /**
     * 세션 참가자 정보 조회
     */
    public Map<String, Object> getSessionParticipants(String sessionId) {
        return sessionParticipants.get(sessionId);
    }
    
    /**
     * 세션의 모든 참가자에게 메시지 전송
     */
    public void notifyParticipants(String sessionId, String messageType, Object data) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", messageType);
        message.put("data", data);
        message.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        log.debug("세션 참가자들에게 메시지 전송 - sessionId: {}, type: {}", sessionId, messageType);
    }
    
    /**
     * 세션 정리
     */
    public void cleanupSession(String sessionId) {
        sessionParticipants.remove(sessionId);
        
        // employeeSessions에서도 제거
        employeeSessions.entrySet().removeIf(entry -> entry.getValue().equals(sessionId));
        
        log.info("세션 정리 완료 - sessionId: {}", sessionId);
    }
    
    /**
     * 행원 로그아웃 시 세션 정리
     */
    public void cleanupEmployeeSession(String employeeId) {
        String sessionId = employeeSessions.get(employeeId);
        if (sessionId != null) {
            // 태블릿에 연결 해제 알림
            notifyParticipants(sessionId, "employee-disconnected", Map.of(
                "message", "행원이 연결을 종료했습니다.",
                "timestamp", System.currentTimeMillis()
            ));
            
            cleanupSession(sessionId);
        }
    }
    
    /**
     * 세션 ID 생성
     */
    private String generateSessionId(String employeeId) {
        return "session_" + employeeId + "_" + System.currentTimeMillis();
    }
    
    /**
     * 활성 세션 목록 조회 (디버깅용)
     */
    public Map<String, String> getActiveSessions() {
        return new HashMap<>(employeeSessions);
    }
}
