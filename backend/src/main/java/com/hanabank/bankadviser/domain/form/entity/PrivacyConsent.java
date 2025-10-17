package com.hanabank.bankadviser.domain.form.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "privacy_consent")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyConsent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "customer_id", nullable = false)
    private String customerId;
    
    @Column(name = "customer_name", nullable = false)
    private String customerName;
    
    @Column(name = "employee_id", nullable = false)
    private String employeeId;
    
    @Column(name = "employee_name", nullable = false)
    private String employeeName;
    
    @Column(name = "consent_type", nullable = false)
    private String consentType;
    
    @Column(name = "consent_given", nullable = false)
    private Boolean consentGiven;
    
    @Column(name = "consent_date")
    private LocalDateTime consentDate;
    
    @Column(name = "consent_purpose", columnDefinition = "TEXT")
    private String consentPurpose;
    
    @Column(name = "consent_items", columnDefinition = "jsonb")
    private String consentItems;
    
    @Column(name = "retention_period")
    private String retentionPeriod;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
