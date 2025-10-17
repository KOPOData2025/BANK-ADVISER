package com.hanabank.bankadviser.domain.consultation.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "customer_id", nullable = false)
    private String customerId;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "employee_id")
    private String employeeId;
    
    @Column(name = "consultation_text", columnDefinition = "TEXT", nullable = false)
    private String consultationText; // 상담 내용 텍스트
    
    @Column(name = "consultation_type")
    private String consultationType; // 상담 유형 (예: 투자상담, 대출상담, 예금상담 등)
    
    @Column(name = "customer_needs", columnDefinition = "TEXT")
    private String customerNeeds; // 고객 니즈 요약
    
    @Column(name = "recommended_products", columnDefinition = "TEXT")
    private String recommendedProducts; // 추천된 상품들 (JSON 형태)
    
    @Column(name = "consultation_summary", columnDefinition = "TEXT")
    private String consultationSummary; // 상담 요약
    
    @Column(name = "status")
    private String status; // 상담 상태 (completed, in_progress, cancelled)
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}