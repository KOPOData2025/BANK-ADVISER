package com.hanabank.bankadviser.domain.consultation.controller;

import com.hanabank.bankadviser.domain.consultation.service.SessionService;
import com.hanabank.bankadviser.domain.product.service.ProductService;
import com.hanabank.bankadviser.domain.customer.service.CustomerService;
import com.hanabank.bankadviser.domain.product.service.RecommendationPipelineService;
import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import com.hanabank.bankadviser.global.config.WebSocketConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.hanabank.bankadviser.global.config.WebSocketConfig;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController extends TextWebSocketHandler {
    
    private static final Logger log = LoggerFactory.getLogger(WebSocketController.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    private final SessionService sessionService;
    private final ProductService productService;
    private final RecommendationPipelineService recommendationPipelineService;
    
    // 단순 WebSocket 세션 저장소
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // STOMP 메시지 핸들러들
    @MessageMapping("/join-session")
    public void joinSession(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = (String) payload.get("sessionId");
        String userType = (String) payload.get("userType");
        String userId = (String) payload.get("userId");
        
        log.info("세션 참여 요청 - sessionId: {}, userType: {}, userId: {}", sessionId, userType, userId);
        
        // 세션 정보를 헤더에 저장
        try {
            Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes == null) {
                sessionAttributes = new HashMap<>();
                headerAccessor.setSessionAttributes(sessionAttributes);
                sessionAttributes = headerAccessor.getSessionAttributes(); // 재할당
            }
            if (sessionAttributes != null) {
                sessionAttributes.put("sessionId", sessionId);
                sessionAttributes.put("userType", userType);
                sessionAttributes.put("userId", userId);
            }
        } catch (Exception e) {
            log.warn("세션 속성 설정 실패: {}", e.getMessage());
        }
        
        // 태블릿이 세션에 참여하는 경우 SessionService 사용
        boolean joinSuccess = true;
        if ("customer-tablet".equals(userType)) {
            joinSuccess = sessionService.joinTabletToSession(sessionId);
        }
        
        // 세션 참여 결과 응답
        Map<String, Object> response = new HashMap<>();
        response.put("type", "session-joined");
        response.put("userType", userType);
        response.put("userId", userId != null ? userId : "anonymous");
        response.put("success", joinSuccess);
        response.put("sessionId", sessionId);
        
        if (joinSuccess) {
            // 성공한 경우 세션 참가자들에게 알림
            sessionService.notifyParticipants(sessionId, "participant-joined", response);
        } else {
            // 실패한 경우 해당 클라이언트에게만 응답
            messagingTemplate.convertAndSendToUser(
                headerAccessor.getSessionId(), 
                "/queue/reply", 
                response
            );
        }
    }
    
    @MessageMapping("/customer-selected")
    public void customerSelected(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Map<String, Object> customerData = (Map<String, Object>) payload.get("customerData");
        
        log.info("고객 선택됨 - sessionId: {}, 고객: {}", sessionId, customerData.get("name"));
        
        // STOMP와 단순 WebSocket 모두에 전송 (호환성을 위해 data와 customerData 모두 포함)
        Map<String, Object> message = new HashMap<>();
        message.put("type", "customer-selected");
        message.put("data", customerData);
        message.put("customerData", customerData);
        message.put("timestamp", System.currentTimeMillis());
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
    }
    
    @MessageMapping("/customer-info-update")
    public void customerInfoUpdate(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        
        log.info("고객 정보 업데이트 - sessionId: {}", sessionId);
        
        // STOMP와 단순 WebSocket 모두에 전송
        Map<String, Object> message = Map.of(
            "type", "customer-info-updated",
            "data", payload
        );
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
    }
    
    @MessageMapping("/product-detail-sync")
    public void productDetailSync(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Object productData = payload.get("productData");
        
        log.info("상품 상세보기 동기화 - sessionId: {}", sessionId);
        
        // 데이터 정규화 (snake_case -> camelCase 등) 및 폼 정보 보강
        Map<String, Object> normalized = normalizeProductData(productData);
        try {
            String productId = (String) normalized.getOrDefault("productId", null);
            String productType = (String) normalized.getOrDefault("productType", null);
            if (productId != null && productType != null) {
                normalized.put("forms", productService.getProductForms(productId, productType));
            }
        } catch (Exception e) {
            log.warn("상품 폼 보강 중 오류: {}", e.getMessage());
        }

        // STOMP와 단순 WebSocket 모두에 전송
        Map<String, Object> message = new HashMap<>();
        message.put("type", "product-visualization-sync");
        message.put("data", normalized);
        message.put("timestamp", System.currentTimeMillis());
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
    }
    
    @MessageMapping("/screen-sync")
    public void screenSync(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Object screenData = payload.get("screenData");
        
        log.info("화면 동기화 - sessionId: {}", sessionId);
        
        // 고객 화면에 동기화
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, Map.of(
            "type", "screen-updated",
            "data", screenData
        ));
    }
    
    /**
     * 상품 가입 시 서식 표시 (PC와 태블릿 동기화)
     */
    @MessageMapping("/product-enrollment")
    public void productEnrollment(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Object productIdObj = payload.get("productId");
        String productId = productIdObj != null ? productIdObj.toString() : null;
        String customerId = (String) payload.get("customerId");
        
        log.info("상품 가입 시작 - sessionId: {}, productId: {}, customerId: {}", sessionId, productId, customerId);
        
        try {
            // 상품 ID가 null이거나 비어있는 경우 처리
            if (productId == null || productId.trim().isEmpty()) {
                log.warn("상품 ID가 제공되지 않았습니다");
                return;
            }
            
            // 상품 ID 정규화 (P033_아이_꿈하나_적금 형식으로 변환)
            String normalizedProductId = productId;
            if (!productId.startsWith("P")) {
                // 숫자만 있는 경우 P033 형식으로 변환
                try {
                    int idNum = Integer.parseInt(productId);
                    normalizedProductId = String.format("P%03d", idNum);
                } catch (NumberFormatException e) {
                    log.warn("상품 ID를 숫자로 변환할 수 없습니다: {}", productId);
                }
            }
            
            log.info("정규화된 상품 ID: {}", normalizedProductId);
            
            Optional<FinancialProduct> productOpt = productService.getProductById(normalizedProductId);
            if (productOpt.isPresent()) {
                FinancialProduct product = productOpt.get();
                
                // 실제 DB에서 EForm 목록 조회
                List<Map<String, Object>> forms = productService.getProductForms(product.getProductId(), product.getProductType());
                
                // 서식이 없으면 로그 출력
                if (forms == null || forms.isEmpty()) {
                    log.warn("상품 {}에 대한 서식이 데이터베이스에 없습니다. 서식 개수: {}", normalizedProductId, forms != null ? forms.size() : 0);
                }
                
                Map<String, Object> enrollmentData = new HashMap<>();
                enrollmentData.put("productId", product.getProductId());
                enrollmentData.put("productName", product.getProductName());
                enrollmentData.put("productType", product.getProductType());
                enrollmentData.put("customerId", customerId);
                enrollmentData.put("forms", forms);
                enrollmentData.put("currentFormIndex", 0); // 첫 번째 서식부터 시작
                enrollmentData.put("totalForms", forms.size());
                
                Map<String, Object> message = Map.of(
                    "type", "product-enrollment",
                    "data", enrollmentData,
                    "action", "start_enrollment",
                    "timestamp", System.currentTimeMillis()
                );
                
                messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
                WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
                log.info("상품 가입 서식 표시 메시지 전송 완료 - 서식 개수: {}", forms.size());
            } else {
                log.warn("상품 ID를 찾을 수 없습니다: {}", normalizedProductId);
                log.info("기본 서식으로 상품 가입 시작 - 상품 ID: {}", normalizedProductId);
                
                // 모든 상품에 대해 기본 서식 4개 제공
                Map<String, Object> defaultData = new HashMap<>();
                defaultData.put("productId", normalizedProductId);
                defaultData.put("productName", "상품 가입");
                defaultData.put("productType", "일반");
                defaultData.put("customerId", customerId);
                
                // 기본 서식 4개 (개인정보 수집·이용 동의서, 은행거래신청서, 개인 전자금융서비스 신청서, 금융거래목적확인서)
                List<Map<String, Object>> defaultForms = List.of(
                    Map.of(
                        "formId", "consent_form",
                        "formName", "개인정보 수집·이용 동의서",
                        "formType", "consent",
                        "fields", List.of(
                            Map.of("id", "customer_name", "name", "고객명", "type", "text", "required", true),
                            Map.of("id", "customer_id", "name", "주민등록번호", "type", "text", "required", true),
                            Map.of("id", "phone", "name", "연락처", "type", "text", "required", true),
                            Map.of("id", "address", "name", "주소", "type", "text", "required", true),
                            Map.of("id", "consent_agree", "name", "개인정보 수집·이용 동의", "type", "checkbox", "required", true),
                            Map.of("id", "consentDate", "name", "동의일자", "type", "date", "required", true),
                            Map.of("id", "signature", "name", "서명", "type", "signature", "required", true)
                        )
                    ),
                    Map.of(
                        "formId", "application_form",
                        "formName", "은행거래신청서",
                        "formType", "application",
                        "fields", List.of(
                            Map.of("id", "account_type", "name", "계좌유형", "type", "select", "required", true),
                            Map.of("id", "deposit_amount", "name", "예금금액", "type", "number", "required", true),
                            Map.of("id", "maturity_date", "name", "만기일", "type", "date", "required", true),
                            Map.of("id", "auto_renewal", "name", "자동재예치", "type", "checkbox", "required", false),
                            Map.of("id", "applicationDate", "name", "신청일자", "type", "date", "required", true),
                            Map.of("id", "signature", "name", "서명", "type", "signature", "required", true)
                        )
                    ),
                    Map.of(
                        "formId", "electronic_finance_form",
                        "formName", "개인 전자금융서비스 신청서",
                        "formType", "electronic_finance",
                        "fields", List.of(
                            Map.of("id", "applicationType", "name", "신청구분", "type", "radio", "required", true),
                            Map.of("id", "serviceType", "name", "서비스 유형", "type", "checkbox", "required", true),
                            Map.of("id", "customerName", "name", "성명", "type", "text", "required", true),
                            Map.of("id", "customerAddress", "name", "주소", "type", "text", "required", true),
                            Map.of("id", "customerEmail", "name", "E-Mail주소", "type", "email", "required", false),
                            Map.of("id", "userId", "name", "이용자 ID", "type", "text", "required", true),
                            Map.of("id", "dailyTransferLimit", "name", "1일이체한도", "type", "text", "required", true),
                            Map.of("id", "singleTransferLimit", "name", "1회이체한도", "type", "text", "required", true),
                            Map.of("id", "applicationDate", "name", "신청일자", "type", "date", "required", true),
                            Map.of("id", "signature", "name", "서명", "type", "signature", "required", true)
                        )
                    ),
                    Map.of(
                        "formId", "financial_purpose_form",
                        "formName", "금융거래목적확인서",
                        "formType", "financial_purpose",
                        "fields", List.of(
                            Map.of("id", "customerName", "name", "고객명", "type", "text", "required", true),
                            Map.of("id", "customerId", "name", "주민등록번호", "type", "text", "required", true),
                            Map.of("id", "transactionPurpose", "name", "거래목적", "type", "select", "required", true),
                            Map.of("id", "expectedAmount", "name", "예상거래금액", "type", "number", "required", true),
                            Map.of("id", "fundSource", "name", "자금출처", "type", "select", "required", true),
                            Map.of("id", "riskTolerance", "name", "위험성향", "type", "radio", "required", true),
                            Map.of("id", "investmentPeriod", "name", "투자기간", "type", "select", "required", true),
                            Map.of("id", "confirmationDate", "name", "확인일자", "type", "date", "required", true),
                            Map.of("id", "signature", "name", "서명", "type", "signature", "required", true)
                        )
                    )
                );
                
                defaultData.put("forms", defaultForms);
                defaultData.put("currentFormIndex", 0);
                defaultData.put("totalForms", defaultForms.size());
                
                Map<String, Object> message = Map.of(
                    "type", "product-enrollment",
                    "data", defaultData,
                    "action", "start_enrollment",
                    "timestamp", System.currentTimeMillis()
                );
                
                messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
                WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
                log.info("기본 서식으로 상품 가입 메시지 전송 완료 - 서식 개수: {}", defaultForms.size());
            }
        } catch (Exception e) {
            log.error("상품 가입 처리 중 오류 발생", e);
        }
    }
    
    /**
     * 화면 하이라이트/밑줄 동기화
     */
    @MessageMapping("/screen-highlight")
    public void screenHighlight(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        
        log.info("화면 하이라이트 동기화 - sessionId: {}, payload: {}", sessionId, payload);
        
        // 새로운 메시지 구조 처리
        Map<String, Object> highlightData = new HashMap<>();
        if (data != null) {
            highlightData.putAll(data);
        } else {
            // 기존 구조 호환성 유지
            highlightData.put("elementId", payload.get("elementId"));
            highlightData.put("highlightType", payload.get("highlightType"));
            highlightData.put("color", payload.get("color"));
        }
        highlightData.put("timestamp", System.currentTimeMillis());
        
        Map<String, Object> message = Map.of(
            "type", "screen-highlight",
            "data", highlightData,
            "timestamp", System.currentTimeMillis()
        );
        
        log.info("하이라이트 메시지 생성: {}", message);
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        log.info("화면 하이라이트 동기화 메시지 전송 완료");
    }
    
    /**
     * 상품설명서 동기화
     */
    @MessageMapping("/product-description")
    public void productDescription(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Map<String, Object> product = (Map<String, Object>) payload.get("product");
        Integer currentPage = (Integer) payload.get("currentPage");
        Integer totalPages = (Integer) payload.get("totalPages");
        
        log.info("상품설명서 동기화 - sessionId: {}, product: {}, page: {}/{}", 
                sessionId, product != null ? product.get("productName") : "null", currentPage, totalPages);
        
        Map<String, Object> descriptionData = new HashMap<>();
        descriptionData.put("product", product);
        descriptionData.put("currentPage", currentPage);
        descriptionData.put("totalPages", totalPages);
        descriptionData.put("timestamp", System.currentTimeMillis());
        
        Map<String, Object> message = Map.of(
            "type", "product-description",
            "data", descriptionData,
            "timestamp", System.currentTimeMillis()
        );
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        log.info("상품설명서 동기화 메시지 전송 완료");
    }
    
    /**
     * 상품 시뮬레이션 동기화
     */
    @MessageMapping("/product-simulation")
    public void productSimulation(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        
        log.info("상품 시뮬레이션 동기화 - sessionId: {}, payload: {}", sessionId, payload);
        
        Map<String, Object> simulationData = new HashMap<>();
        if (data != null) {
            simulationData.putAll(data);
        }
        simulationData.put("timestamp", System.currentTimeMillis());
        
        Map<String, Object> message = Map.of(
            "type", "product-simulation",
            "data", simulationData,
            "timestamp", System.currentTimeMillis()
        );
        
        log.info("시뮬레이션 메시지 생성: {}", message);
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        log.info("상품 시뮬레이션 동기화 메시지 전송 완료");
    }
    
    /**
     * 상품설명서 닫기
     */
    @MessageMapping("/product-description-close")
    public void productDescriptionClose(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        
        log.info("상품설명서 닫기 요청 수신 - sessionId: {}, payload: {}", sessionId, payload);
        
        Map<String, Object> message = Map.of(
            "type", "product-description-close",
            "data", Map.of("sessionId", sessionId),
            "timestamp", System.currentTimeMillis()
        );
        
        log.info("상품설명서 닫기 메시지 생성: {}", message);
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        log.info("상품설명서 닫기 메시지 전송 완료 - sessionId: {}", sessionId);
    }
    
    /**
     * 서식 네비게이션 (다음/이전 서식)
     */
    @MessageMapping("/form-navigation")
    public void formNavigation(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String direction = (String) payload.get("direction"); // "next", "prev"
        Integer currentIndex = (Integer) payload.get("currentIndex");
        String productId = (String) payload.get("productId");
        
        log.info("서식 네비게이션 - sessionId: {}, direction: {}, currentIndex: {}", sessionId, direction, currentIndex);
        
        try {
            Optional<FinancialProduct> productOpt = productService.getProductById(productId);
            if (productOpt.isPresent()) {
                FinancialProduct product = productOpt.get();
                List<Map<String, Object>> forms = productService.getProductForms(product.getProductId(), product.getProductType());
                
                int newIndex = currentIndex;
                if ("next".equals(direction) && currentIndex < forms.size() - 1) {
                    newIndex = currentIndex + 1;
                } else if ("prev".equals(direction) && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                }
                
                Map<String, Object> formData = new HashMap<>();
                formData.put("productId", productId);
                formData.put("currentFormIndex", newIndex);
                formData.put("currentForm", forms.get(newIndex));
                formData.put("totalForms", forms.size());
                formData.put("canGoNext", newIndex < forms.size() - 1);
                formData.put("canGoPrev", newIndex > 0);
                
                Map<String, Object> message = Map.of(
                    "type", "form-navigation",
                    "data", formData,
                    "timestamp", System.currentTimeMillis()
                );
                
                messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
                WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
                log.info("서식 네비게이션 메시지 전송 완료 - 새 인덱스: {}", newIndex);
            }
        } catch (Exception e) {
            log.error("서식 네비게이션 처리 중 오류 발생", e);
        }
    }

    // Helper: 상품 데이터 정규화
    private Map<String, Object> normalizeProductData(Object productData) {
        Map<String, Object> result = new HashMap<>();
        if (productData instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> raw = (Map<String, Object>) productData;
            // 가능한 키들을 모두 수용 (snake_case, camelCase 혼용 호환)
            putIfPresent(raw, result, "productId", "productId", "product_id", "id");
            putIfPresent(raw, result, "productName", "productName", "product_name", "name");
            putIfPresent(raw, result, "productType", "productType", "product_type", "type");
            putIfPresent(raw, result, "description", "description", "product_features", "desc");
            putIfPresent(raw, result, "targetCustomers", "targetCustomers", "target_customers");
            putIfPresent(raw, result, "minAmount", "minAmount", "min_amount");
            putIfPresent(raw, result, "maxAmount", "maxAmount", "max_amount");
            putIfPresent(raw, result, "baseRate", "baseRate", "base_rate");
            putIfPresent(raw, result, "launchDate", "launchDate", "launch_date");
            putIfPresent(raw, result, "salesStatus", "salesStatus", "sales_status");
            // 원본도 함께 첨부 (디버깅/후방 호환)
            result.put("_raw", raw);
        }
        return result;
    }

    private void putIfPresent(Map<?, ?> src, Map<String, Object> dst, String dstKey, String... candidates) {
        for (String key : candidates) {
            if (src.containsKey(key)) {
                dst.put(dstKey, src.get(key));
                return;
            }
        }
    }
    
    @MessageMapping("/send-to-session")
    public void sendToSession(@Payload Map<String, Object> payload) {
        try {
            String sessionId = (String) payload.get("sessionId");
            String type = (String) payload.get("type");
            Object data = payload.get("data");
            
            log.info("=== 메시지 수신 ===");
            log.info("세션으로 데이터 전송 - sessionId: {}, type: {}", sessionId, type);
            log.info("전체 페이로드: {}", payload);
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                log.error("세션 ID가 없습니다!");
                return;
            }
            
            // 태블릿으로 데이터 전송 - 메시지 타입별 구체적 처리
            Map<String, Object> response = new HashMap<>();
            response.put("type", type);
            response.put("timestamp", System.currentTimeMillis());
            
            // 메시지 타입별 데이터 구조화
            if ("customer-info-display".equals(type) && data instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> dataMap = (Map<String, Object>) data;
                Map<String, Object> customerInfo = (Map<String, Object>) dataMap.get("customer");
                if (customerInfo != null) {
                    // 고객 정보를 태블릿 친화적 형태로 재구성
                    Map<String, Object> tabletFriendlyCustomer = new HashMap<>();
                    tabletFriendlyCustomer.put("customerId", customerInfo.get("CustomerID"));
                    tabletFriendlyCustomer.put("name", customerInfo.get("Name"));
                    tabletFriendlyCustomer.put("phone", customerInfo.get("Phone"));
                    tabletFriendlyCustomer.put("age", customerInfo.get("Age"));
                    tabletFriendlyCustomer.put("address", customerInfo.get("Address"));
                    tabletFriendlyCustomer.put("idNumber", customerInfo.get("IdNumber"));
                    
                    response.put("data", tabletFriendlyCustomer);
                    response.put("action", "show_customer_info");
                    
                    log.info("고객 정보 태블릿 전송 - 고객: {}", customerInfo.get("Name"));
                } else {
                    response.put("data", data);
                }
            } else {
                response.put("data", data);
            }
            
            String destination = "/topic/session/" + sessionId;
            log.info("메시지 전송 대상: {}", destination);
            
            // STOMP 전송
            messagingTemplate.convertAndSend(destination, response);
            
            // 단순 WebSocket 브리지 전송
            WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, response);
            
            log.info("메시지 전송 완료 (STOMP + WebSocket 브리지)");
            
        } catch (Exception e) {
            log.error("메시지 처리 중 오류 발생: ", e);
        }
    }
    
    @MessageMapping("/send-message")
    public void sendMessage(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String type = (String) payload.get("type");
        Object data = payload.get("data");
        
        log.info("메시지 전송 - sessionId: {}, type: {}", sessionId, type);
        
        // 개인정보 동의 응답인 경우 특별 처리
        if ("privacy-consent-response".equals(type)) {
            log.info("개인정보 동의 응답 처리 - sessionId: {}, data: {}", sessionId, data);
        }
        
        // 세션 내 다른 참가자들에게 메시지 전송 (원본 타입 유지)
        Map<String, Object> message = new HashMap<>();
        message.put("type", type);
        message.put("data", data);
        message.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        log.info("메시지 전송 완료 - sessionId: {}, type: {}", sessionId, type);
    }
    
    @MessageMapping("/client-to-tablet")
    public void clientToTablet(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String messageType = (String) payload.get("messageType");
        Object data = payload.get("data");
        
        log.info("클라이언트에서 태블릿으로 메시지 - sessionId: {}, messageType: {}", sessionId, messageType);
        
        // 태블릿으로 메시지 전송
        Map<String, Object> response = new HashMap<>();
        response.put("type", "client-message");
        response.put("messageType", messageType);
        response.put("data", data);
        response.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, response);
        log.info("클라이언트 메시지 태블릿 전송 완료");
    }
    
    @MessageMapping("/send-to-employee")
    public void sendToEmployee(@Payload Map<String, Object> payload) {
        try {
            String sessionId = (String) payload.get("sessionId");
            String type = (String) payload.get("type");
            Object data = payload.get("data");
            
            log.info("=== 태블릿에서 직원 PC로 메시지 전송 ===");
            log.info("sessionId: {}, type: {}", sessionId, type);
            log.info("전체 페이로드: {}", payload);
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                log.error("세션 ID가 없습니다!");
                return;
            }
            
            // 직원 PC로 메시지 전송
            Map<String, Object> response = new HashMap<>();
            response.put("type", type);
            response.put("data", data);
            response.put("timestamp", System.currentTimeMillis());
            
            String destination = "/topic/employee/" + sessionId;
            log.info("직원 PC로 메시지 전송 대상: {}", destination);
            
            // STOMP 전송
            messagingTemplate.convertAndSend(destination, response);
            
            log.info("직원 PC로 메시지 전송 완료");
            
        } catch (Exception e) {
            log.error("직원 PC로 메시지 전송 중 오류 발생: ", e);
        }
    }
    
    @MessageMapping("/tablet-to-client")
    public void tabletToClient(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String messageType = (String) payload.get("messageType");
        Object data = payload.get("data");
        
        log.info("태블릿에서 클라이언트로 메시지 - sessionId: {}, messageType: {}", sessionId, messageType);
        
        // 클라이언트로 메시지 전송
        Map<String, Object> response = new HashMap<>();
        response.put("type", "tablet-message");
        response.put("messageType", messageType);
        response.put("data", data);
        response.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, response);
        log.info("태블릿 메시지 클라이언트 전송 완료");
    }
    
    /**
     * PC에서 필드 포커스 처리 (태블릿에 필드 입력 모드 활성화)
     */
    @MessageMapping("/field-focus")
    public void fieldFocus(@Payload Map<String, Object> payload) {
        log.info("=== 필드 포커스 메시지 수신 (하이라이트와 동일한 구조) ===");
        log.info("전체 payload: {}", payload);
        
        String sessionId = (String) payload.get("sessionId");
        
        // 하이라이트와 동일한 메시지 구조 - data 객체에 필드 정보 포함
        Map<String, Object> fieldData = new HashMap<>();
        fieldData.put("fieldId", payload.get("fieldId"));
        fieldData.put("fieldName", payload.get("fieldName"));
        fieldData.put("fieldLabel", payload.get("fieldLabel"));
        fieldData.put("fieldType", payload.get("fieldType"));
        fieldData.put("fieldPlaceholder", payload.get("fieldPlaceholder"));
        fieldData.put("formIndex", payload.get("formIndex"));
        fieldData.put("formName", payload.get("formName"));
        fieldData.put("timestamp", System.currentTimeMillis());
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "field-focus");
        message.put("data", fieldData);
        message.put("timestamp", System.currentTimeMillis());
        
        log.info("전송할 메시지 (하이라이트와 동일한 구조): {}", message);
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        
        log.info("필드 포커스 메시지 전송 완료");
    }

    /**
     * 태블릿에서 필드 입력 완료 처리 (PC와 태블릿 동기화) - 새로운 형식
     */
    @MessageMapping("/field-input-completed")
    public void fieldInputCompleted(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String fieldId = (String) payload.get("fieldId");
        String fieldValue = (String) payload.get("fieldValue");
        String fieldLabel = (String) payload.get("fieldLabel");
        String formId = (String) payload.get("formId");
        
        log.info("필드 입력 완료 (새로운 형식) - sessionId: {}, fieldId: {}, value: {}", sessionId, fieldId, fieldValue);
        
        // PC와 태블릿 모두에 필드 입력 완료 메시지 전송
        Map<String, Object> message = new HashMap<>();
        message.put("type", "field-input-completed");
        message.put("fieldId", fieldId);
        message.put("fieldValue", fieldValue);
        message.put("fieldLabel", fieldLabel);
        message.put("formId", formId);
        message.put("timestamp", System.currentTimeMillis());
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        
        log.info("필드 입력 완료 메시지 전송 완료 - PC와 태블릿 동기화");
    }
    
    /**
     * 태블릿에서 필드 입력 완료 처리 (PC와 태블릿 동기화) - 기존 형식
     */
    @MessageMapping("/field-input-complete")
    public void fieldInputComplete(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        Object dataObj = payload.get("data");
        
        log.info("필드 입력 완료 (기존 형식) - sessionId: {}, payload: {}", sessionId, payload);
        
        // 기존 메시지 구조에서 데이터 추출
        String fieldId = "";
        String fieldValue = "";
        String fieldLabel = "";
        
        if (dataObj instanceof Map) {
            Map<String, Object> data = (Map<String, Object>) dataObj;
            fieldId = (String) data.get("fieldId");
            fieldValue = (String) data.get("value");
            fieldLabel = (String) data.get("fieldName");
        }
        
        if (fieldId == null || fieldValue == null || fieldId.isEmpty() || fieldValue.isEmpty()) {
            log.warn("기존 형식 필드 입력 완료 데이터 누락: fieldId={}, value={}", fieldId, fieldValue);
            return;
        }
        
        if (fieldLabel == null || fieldLabel.isEmpty()) {
            fieldLabel = "알 수 없는 필드";
        }
        
        log.info("기존 형식 필드 입력 완료 파싱 - fieldId: {}, value: {}, label: {}", fieldId, fieldValue, fieldLabel);
        
        // PC와 태블릿 모두에 필드 입력 완료 메시지 전송 (새로운 형식으로 변환)
        Map<String, Object> message = new HashMap<>();
        message.put("type", "field-input-completed");
        message.put("fieldId", fieldId);
        message.put("fieldValue", fieldValue);
        message.put("fieldLabel", fieldLabel);
        message.put("fieldType", "text");
        message.put("timestamp", System.currentTimeMillis());
        
        // STOMP 전송
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, message);
        
        // 단순 WebSocket 브리지 전송
        WebSocketConfig.SimpleWebSocketHandler.broadcastToSimpleWebSocket(sessionId, message);
        
        log.info("기존 형식 필드 입력 완료 메시지 전송 완료 - PC와 태블릿 동기화");
    }
    
    @MessageMapping("/form-data")
    public void handleFormData(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String formType = (String) payload.get("formType");
        Object formData = payload.get("formData");
        
        log.info("폼 데이터 처리 - sessionId: {}, formType: {}", sessionId, formType);
        
        // 세션 내 모든 참가자에게 폼 데이터 전송
        Map<String, Object> response = new HashMap<>();
        response.put("type", "form-data-updated");
        response.put("formType", formType);
        response.put("formData", formData);
        response.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, response);
        log.info("폼 데이터 전송 완료");
    }
    
    @MessageMapping("/test-connection")
    public void testConnection(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String clientType = (String) payload.get("clientType");
        
        log.info("연결 테스트 - sessionId: {}, clientType: {}", sessionId, clientType);
        
        // 연결 확인 응답
        Map<String, Object> response = new HashMap<>();
        response.put("type", "connection-test-response");
        response.put("clientType", clientType);
        response.put("sessionId", sessionId);
        response.put("message", "연결이 정상적으로 작동 중입니다.");
        response.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, response);
        log.info("연결 테스트 응답 전송 완료");
    }
    
    @MessageMapping("/request-recommendation")
    public void handleRecommendationRequest(@Payload Map<String, Object> payload) {
        try {
            String sessionId = (String) payload.get("sessionId");
            String customerId = (String) payload.get("customerId");
            String intent = (String) payload.get("intent");
            String transcript = (String) payload.get("transcript");
            
            log.info("🎯 추천 요청 수신 - sessionId: {}, customerId: {}, intent: {}, transcript: {}", 
                    sessionId, customerId, intent, transcript);
            
            // 추천 파이프라인 서비스 호출
            RecommendationPipelineService.RecommendationResult result = 
                recommendationPipelineService.executeRecommendationPipeline(customerId, transcript);
            
            // WebSocket으로 추천 결과 전송
            Map<String, Object> recommendationData = new HashMap<>();
            recommendationData.put("sessionId", sessionId);
            recommendationData.put("customerId", customerId);
            recommendationData.put("intent", result.getIntentAnalysis() != null ? result.getIntentAnalysis().getIntent() : intent);
            recommendationData.put("confidence", result.getConfidence());
            recommendationData.put("recommendations", result.getRecommendations());
            recommendationData.put("timestamp", result.getTimestamp());
            
            // 추천 결과 전송
            sendRecommendationResult(customerId, recommendationData);
            
            log.info("✅ 추천 요청 처리 완료 - sessionId: {}", sessionId);
            
        } catch (Exception e) {
            log.error("추천 요청 처리 중 오류 발생", e);
            
            // 오류 응답 전송
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "recommendation_error");
            errorResponse.put("error", "추천 처리 중 오류가 발생했습니다.");
            errorResponse.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/session/" + payload.get("sessionId"), errorResponse);
        }
    }
    
    @MessageMapping("/web-to-tablet")
    public void webToTablet(@Payload Map<String, Object> payload) {
        String sessionId = (String) payload.get("sessionId");
        String messageType = (String) payload.get("messageType");
        Object data = payload.get("data");
        
        log.info("웹에서 태블릿으로 메시지 - sessionId: {}, messageType: {}", sessionId, messageType);
        
        try {
            // STOMP로 브로드캐스트 (태블릿도 받을 수 있도록)
            Map<String, Object> response = new HashMap<>();
            response.put("type", "web-message");
            response.put("messageType", messageType);
            response.put("sessionId", sessionId);
            response.put("data", data);
            response.put("source", "web");
            response.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/session/" + sessionId, response);
            log.info("웹 메시지 브로드캐스트 완료");
            
        } catch (Exception e) {
            log.error("웹-태블릿 메시지 전송 오류: ", e);
        }
    }

    // 단순 WebSocket 핸들러들 (STOMP 없이)
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("단순 WebSocket 연결 성공: {}", session.getId());
        sessions.put(session.getId(), session);
        
        // 연결 확인 메시지 전송
        session.sendMessage(new TextMessage("{\"type\":\"connection-established\",\"sessionId\":\"" + session.getId() + "\"}"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.info("단순 WebSocket 메시지 수신: {}", message.getPayload());
        
        try {
            // JSON 파싱 및 처리
            String payload = message.getPayload();
            
            // 간단한 응답 메시지 전송
            String response = "{\"type\":\"message-received\",\"originalMessage\":\"" + payload + "\",\"timestamp\":\"" + System.currentTimeMillis() + "\"}";
            session.sendMessage(new TextMessage(response));
            
            // 다른 세션들에게도 브로드캐스트 (옵션)
            for (WebSocketSession otherSession : sessions.values()) {
                if (!otherSession.getId().equals(session.getId()) && otherSession.isOpen()) {
                    otherSession.sendMessage(new TextMessage("{\"type\":\"broadcast\",\"message\":\"다른 클라이언트에서 메시지를 보냈습니다.\"}"));
                }
            }
            
        } catch (Exception e) {
            log.error("메시지 처리 오류", e);
            session.sendMessage(new TextMessage("{\"type\":\"error\",\"message\":\"메시지 처리 중 오류가 발생했습니다.\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        log.info("단순 WebSocket 연결 종료: {} - {}", session.getId(), status);
        sessions.remove(session.getId());
    }

    /**
     * 추천 결과를 WebSocket으로 전송
     */
    public void sendRecommendationResult(String customerId, Map<String, Object> recommendationData) {
        try {
            log.info("📡 추천 결과 WebSocket 전송 - 고객ID: {}", customerId);
            
            // 고객 이름 조회 (기본값: "고객님")
            String customerName = "고객님";
            try {
                // 고객 서비스를 통해 고객 이름 조회
                // customerService.getCustomerById(customerId).getName() 등으로 조회 가능
                // 현재는 기본값 사용
            } catch (Exception e) {
                log.warn("고객 이름 조회 실패, 기본값 사용: {}", e.getMessage());
            }
            
            // 추천 데이터를 새로운 HashMap으로 복사하고 고객 이름 추가
            Map<String, Object> enhancedRecommendationData = new HashMap<>(recommendationData);
            enhancedRecommendationData.put("customerName", customerName);
            
            Map<String, Object> message = new HashMap<>();
            message.put("type", "ai-recommendations");
            message.put("customerId", customerId);
            message.put("data", enhancedRecommendationData);
            message.put("timestamp", System.currentTimeMillis());
            
            // 고객 세션으로 전송
            messagingTemplate.convertAndSend("/topic/customer/" + customerId, message);
            
            // 전체 세션으로도 전송 (행원 화면용)
            messagingTemplate.convertAndSend("/topic/recommendations", message);
            
            // 태블릿 세션으로도 전송
            messagingTemplate.convertAndSend("/topic/session/tablet_main", message);
            
            log.info("✅ 추천 결과 전송 완료 - 고객ID: {}", customerId);
            
        } catch (Exception e) {
            log.error("추천 결과 WebSocket 전송 중 오류 발생", e);
        }
    }
}
