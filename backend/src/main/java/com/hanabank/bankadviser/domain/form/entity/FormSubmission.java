package com.hanabank.bankadviser.domain.form.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "form_submission")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "submission_id", unique = true, nullable = false)
    private String submissionId;
    
    @Column(name = "customer_id", nullable = false)
    private String customerId;
    
    @Column(name = "employee_id", nullable = false)
    private String employeeId;
    
    @Column(name = "product_id", nullable = false)
    private String productId;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "form_id", nullable = false)
    private String formId;
    
    @Column(name = "form_name", nullable = false)
    private String formName;
    
    @Column(name = "form_type", nullable = false)
    private String formType;
    
    @Column(name = "form_data", columnDefinition = "TEXT", nullable = false)
    private String formData; // JSON 형태의 서식 데이터
    
    @Column(name = "screenshot_url")
    private String screenshotUrl; // 스크린샷 파일 URL
    
    @Column(name = "json_file_url")
    private String jsonFileUrl; // JSON 파일 URL
    
    @Column(name = "completion_rate")
    private Integer completionRate;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
