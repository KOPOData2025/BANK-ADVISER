package com.hanabank.bankadviser.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSocket
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

    @Value("${websocket.allowed.origins}")
    private String allowedOrigins;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트에서 구독할 수 있는 경로 설정
        config.enableSimpleBroker("/topic", "/queue");
        
        // 클라이언트에서 메시지를 보낼 때 사용할 경로 설정
        config.setApplicationDestinationPrefixes("/app");

        // STOMP 설정 개선 - React Native 환경 대응
        config.setPreservePublishOrder(true);
        
        // STOMP 버전 설정 명시
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS WebSocket 엔드포인트 (React Native용) - 기본 경로
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setHeartbeatTime(30000)
                .setDisconnectDelay(30000)
                .setHttpMessageCacheSize(2000)
                .setWebSocketEnabled(true)
                .setSessionCookieNeeded(false)
                .setStreamBytesLimit(512 * 1024);

        // API 경로 SockJS 엔드포인트 (태블릿에서 사용)
        registry.addEndpoint("/api/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setHeartbeatTime(30000)
                .setDisconnectDelay(30000)
                .setHttpMessageCacheSize(2000)
                .setWebSocketEnabled(true)
                .setSessionCookieNeeded(false)
                .setStreamBytesLimit(512 * 1024);

        // 네이티브 WebSocket 엔드포인트 (웹 브라우저용)
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("*");

        // 추가 STOMP 엔드포인트 (React Native STOMP 연결용)
        registry.addEndpoint("/stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setHeartbeatTime(30000)
                .setDisconnectDelay(30000)
                .setHttpMessageCacheSize(2000)
                .setWebSocketEnabled(true)
                .setSessionCookieNeeded(false)
                .setStreamBytesLimit(512 * 1024);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // WebSocket 전송 설정 개선 - React Native 환경 대응
        registration.setMessageSizeLimit(128 * 1024) // 128KB로 증가
                   .setSendBufferSizeLimit(1024 * 1024) // 1MB로 증가
                   .setSendTimeLimit(60000) // 60초로 증가 (React Native 대응)
                   .setTimeToFirstMessage(60000); // 첫 메시지까지 대기 시간 증가
    }

    // WebSocketConfigurer 구현 - 단순 WebSocket 핸들러 등록
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        SimpleWebSocketHandler handler = new SimpleWebSocketHandler(objectMapper);
        registry.addHandler(handler, "/simple-ws")
                .setAllowedOrigins("http://localhost:3000");
    }
    
    // SimpMessagingTemplate 주입을 위한 메서드 (순환 참조 방지)
    // @Autowired
    // public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
    //     SimpleWebSocketHandler.setMessagingTemplate(messagingTemplate);
    // }

    // 단순 WebSocket 메시지 핸들러
    public static class SimpleWebSocketHandler extends TextWebSocketHandler {
        
        private final ObjectMapper objectMapper;
        private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
        private static final Map<String, String> sessionToRoom = new ConcurrentHashMap<>(); // sessionId -> roomId

        public SimpleWebSocketHandler(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }
        
        // STOMP 메시징 템플릿 설정 메서드 (순환 참조 방지로 제거)
        // public static void setMessagingTemplate(SimpMessagingTemplate template) {
        //     messagingTemplate = template;
        // }
        
        // STOMP 메시지를 단순 WebSocket으로 브리지하는 정적 메서드
        public static void broadcastToSimpleWebSocket(String sessionId, Object message) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                String jsonMessage = mapper.writeValueAsString(message);
                
                // 해당 세션(룸)에 연결된 모든 단순 WebSocket 세션에 메시지 전송
                sessions.entrySet().forEach(entry -> {
                    WebSocketSession wsSession = entry.getValue();
                    String roomId = sessionToRoom.get(wsSession.getId());
                    
                    if (sessionId.equals(roomId) && wsSession.isOpen()) {
                        try {
                            wsSession.sendMessage(new TextMessage(jsonMessage));
                            System.out.println("✅ STOMP → WebSocket 브리지 전송 성공: " + sessionId + " → " + wsSession.getId());
                        } catch (Exception e) {
                            System.err.println("❌ STOMP → WebSocket 브리지 전송 실패: " + e.getMessage());
                        }
                    }
                });
            } catch (Exception e) {
                System.err.println("❌ STOMP → WebSocket 브리지 메시지 변환 실패: " + e.getMessage());
            }
        }
        


        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
            try {
                String payload = message.getPayload();
                System.out.println("단순 WebSocket 메시지 수신: " + payload);
                
                JsonNode jsonNode = objectMapper.readTree(payload);
                String type = jsonNode.get("type").asText();
                String sessionId = jsonNode.get("sessionId").asText();
                
                switch (type) {
                    case "join-session":
                        // 세션 참여 처리
                        String userType = jsonNode.get("userType").asText();
                        System.out.println("세션 참여: " + sessionId + ", 사용자 타입: " + userType);
                        
                        // 세션-방 매핑 저장
                        sessionToRoom.put(session.getId(), sessionId);
                        System.out.println("✅ 세션 매핑 저장: " + session.getId() + " -> " + sessionId);
                        
                        // 세션 참여 성공 메시지 전송 (단순 WebSocket)
                        String response = objectMapper.writeValueAsString(Map.of(
                            "type", "session-joined",
                            "sessionId", sessionId,
                            "userType", userType,
                            "success", true,
                            "message", "세션 참여 성공!"
                        ));
                        session.sendMessage(new TextMessage(response));
                        
                        System.out.println("✅ 태블릿 세션 참여 완료: " + sessionId);
                        break;
                        
                    case "test-message":
                        // 테스트 메시지 처리
                        String clientType = jsonNode.has("clientType") ? jsonNode.get("clientType").asText() : "unknown";
                        String testMsg = jsonNode.has("message") ? jsonNode.get("message").asText() : "";
                        System.out.println("테스트 메시지 수신: " + sessionId + ", 클라이언트: " + clientType + ", 메시지: " + testMsg);
                        
                        // 테스트 응답 메시지 전송 (단순 WebSocket)
                        String testResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "test-response",
                            "sessionId", sessionId,
                            "clientType", clientType,
                            "originalMessage", testMsg,
                            "response", "백엔드에서 테스트 메시지를 정상적으로 받았습니다!",
                            "timestamp", System.currentTimeMillis()
                        ));
                        session.sendMessage(new TextMessage(testResponse));
                        
                        System.out.println("✅ 태블릿 테스트 메시지 처리 완료: " + sessionId);
                        break;
                        
                    case "ping":
                        // Keep-alive ping 처리
                        System.out.println("🏓 Keep-alive ping 수신: " + sessionId);
                        
                        // Pong 응답 전송
                        String pongResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "pong",
                            "sessionId", sessionId,
                            "timestamp", System.currentTimeMillis()
                        ));
                        session.sendMessage(new TextMessage(pongResponse));
                        break;
                        
                    case "start-consultation":
                        // 상담 시작 처리
                        System.out.println("상담 시작: " + sessionId);
                        // STOMP 메시지 대신 직접 WebSocket으로 응답
                        String consultationResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "consultation-started",
                            "sessionId", sessionId
                        ));
                        session.sendMessage(new TextMessage(consultationResponse));
                        break;
                        
                    case "customer-info-confirmed":
                        // 고객 정보 확인 처리
                        System.out.println("고객 정보 확인: " + sessionId);
                        String customerResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "customer-info-confirmed",
                            "sessionId", sessionId
                        ));
                        session.sendMessage(new TextMessage(customerResponse));
                        break;
                        
                    case "field-input-completed":
                        // 필드 입력 완료 처리
                        System.out.println("필드 입력 완료: " + sessionId);
                        
                        // 필드 입력 완료 데이터 추출 (새로운 구조)
                        String fieldId = jsonNode.has("fieldId") ? jsonNode.get("fieldId").asText() : "";
                        String fieldValue = jsonNode.has("fieldValue") ? jsonNode.get("fieldValue").asText() : "";
                        String fieldLabel = jsonNode.has("fieldLabel") ? jsonNode.get("fieldLabel").asText() : "";
                        String fieldType = jsonNode.has("fieldType") ? jsonNode.get("fieldType").asText() : "text";
                        
                        if (fieldId.isEmpty() || fieldValue.isEmpty()) {
                            System.err.println("❌ 필드 입력 완료 데이터 누락: fieldId=" + fieldId + ", fieldValue=" + fieldValue);
                            break;
                        }
                        
                        // PC와 태블릿 모두에 전송할 메시지 생성
                        Map<String, Object> fieldMessage = Map.of(
                            "type", "field-input-completed",
                            "fieldId", fieldId,
                            "fieldValue", fieldValue,
                            "fieldLabel", fieldLabel,
                            "fieldType", fieldType,
                            "timestamp", System.currentTimeMillis()
                        );
                        
                        // 단순 WebSocket 응답
                        String fieldResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "field-input-completed",
                            "sessionId", sessionId,
                            "fieldId", fieldId,
                            "fieldValue", fieldValue,
                            "fieldLabel", fieldLabel,
                            "success", true,
                            "message", "필드 입력이 PC와 동기화되었습니다"
                        ));
                        session.sendMessage(new TextMessage(fieldResponse));
                        
                        // 다른 세션들에게도 브로드캐스트 (PC 동기화)
                        broadcastToSimpleWebSocket(sessionId, fieldMessage);
                        
                        // STOMP로도 전송 (PC 클라이언트 동기화) - 순환 참조 방지로 제거
                        // if (messagingTemplate != null) {
                        //     try {
                        //         messagingTemplate.convertAndSend("/topic/session/" + sessionId, fieldMessage);
                        //         System.out.println("✅ STOMP로 PC에 필드 입력 완료 전송");
                        //     } catch (Exception e) {
                        //         System.err.println("❌ STOMP 전송 실패: " + e.getMessage());
                        //     }
                        // }
                        
                        System.out.println("✅ 필드 입력 완료 메시지 브로드캐스트 완료");
                        break;
                        
                    case "field-input-complete":
                        // 필드 입력 완료 처리 (기존 형식)
                        System.out.println("필드 입력 완료 (기존 형식): " + sessionId);
                        
                        // 기존 메시지 구조에서 데이터 추출
                        String existingFieldId = "";
                        String existingFieldValue = "";
                        String existingFieldLabel = "";
                        
                        if (jsonNode.has("data") && jsonNode.get("data").has("value")) {
                            // data.value 구조
                            existingFieldId = jsonNode.get("data").has("fieldId") ? jsonNode.get("data").get("fieldId").asText() : "";
                            existingFieldValue = jsonNode.get("data").get("value").asText();
                            existingFieldLabel = jsonNode.get("data").has("fieldName") ? jsonNode.get("data").get("fieldName").asText() : "알 수 없는 필드";
                        } else if (jsonNode.has("fieldId")) {
                            // 최상위 구조
                            existingFieldId = jsonNode.get("fieldId").asText();
                            existingFieldValue = jsonNode.has("fieldValue") ? jsonNode.get("fieldValue").asText() : "";
                            existingFieldLabel = jsonNode.has("fieldLabel") ? jsonNode.get("fieldLabel").asText() : "알 수 없는 필드";
                        }
                        
                        if (existingFieldId.isEmpty() || existingFieldValue.isEmpty()) {
                            System.err.println("❌ 기존 형식 필드 입력 완료 데이터 누락: fieldId=" + existingFieldId + ", value=" + existingFieldValue);
                            break;
                        }
                        
                        // PC와 태블릿 모두에 전송할 메시지 생성 (새로운 형식으로 변환)
                        Map<String, Object> existingFieldMessage = Map.of(
                            "type", "field-input-completed",
                            "fieldId", existingFieldId,
                            "fieldValue", existingFieldValue,
                            "fieldLabel", existingFieldLabel,
                            "fieldType", "text",
                            "timestamp", System.currentTimeMillis()
                        );
                        
                        // 단순 WebSocket 응답
                        String existingFieldResponse = objectMapper.writeValueAsString(Map.of(
                            "type", "field-input-completed",
                            "sessionId", sessionId,
                            "fieldId", existingFieldId,
                            "fieldValue", existingFieldValue,
                            "fieldLabel", existingFieldLabel,
                            "success", true,
                            "message", "필드 입력이 PC와 동기화되었습니다"
                        ));
                        session.sendMessage(new TextMessage(existingFieldResponse));
                        
                        // 다른 세션들에게도 브로드캐스트 (PC 동기화)
                        broadcastToSimpleWebSocket(sessionId, existingFieldMessage);
                        
                        System.out.println("✅ 기존 형식 필드 입력 완료 메시지 브로드캐스트 완료");
                        break;
                        
                    default:
                        System.out.println("알 수 없는 메시지 타입: " + type);
                        break;
                }
                
            } catch (Exception e) {
                System.err.println("단순 WebSocket 메시지 처리 오류: " + e.getMessage());
                e.printStackTrace();
            }
        }

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            System.out.println("단순 WebSocket 연결 성공: " + session.getId());
            sessions.put(session.getId(), session);
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
            System.out.println("단순 WebSocket 연결 종료: " + session.getId() + ", 상태: " + status);
            sessions.remove(session.getId());
            String roomId = sessionToRoom.remove(session.getId());
            if (roomId != null) {
                System.out.println("✅ 세션 매핑 제거: " + session.getId() + " -> " + roomId);
            }
        }
        
        // 웹에서 태블릿으로 메시지를 전달하는 메서드
        public void sendToTablet(String roomId, String message) {
            for (Map.Entry<String, String> entry : sessionToRoom.entrySet()) {
                if (roomId.equals(entry.getValue())) {
                    String sessionId = entry.getKey();
                    WebSocketSession session = sessions.get(sessionId);
                    if (session != null && session.isOpen()) {
                        try {
                            session.sendMessage(new TextMessage(message));
                            System.out.println("✅ 태블릿으로 메시지 전송: " + sessionId + " -> " + roomId);
                        } catch (Exception e) {
                            System.err.println("❌ 태블릿 메시지 전송 실패: " + e.getMessage());
                        }
                    }
                }
            }
        }
    }
}
