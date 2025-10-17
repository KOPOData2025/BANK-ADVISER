package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProduct {
    
    @Id
    @Column(name = "productid", nullable = false)
    private String productId;
    
    @Column(name = "productname", nullable = false)
    private String productName;
    
    @Column(name = "producttype")
    private String productType;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "launchdate")
    private LocalDate launchDate;
    
    @Column(name = "salesstatus")
    private String salesStatus;
    
    @Column(name = "minamount", precision = 15, scale = 2)
    private BigDecimal minAmount;
    
    @Column(name = "maxamount", precision = 15, scale = 2)
    private BigDecimal maxAmount;
    
    @Column(name = "baserate", precision = 5, scale = 2)
    private BigDecimal baseRate;
    
    @Column(name = "document_path")
    private String documentPath; // 상품 설명서 경로
    
    @Column(name = "document_name")
    private String documentName; // 상품 설명서 파일명

    // Lombok 미작동 시 대비한 명시적 getter/setter
    public String getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductType() { return productType; }
    public String getDescription() { return description; }
    public java.time.LocalDate getLaunchDate() { return launchDate; }
    public String getSalesStatus() { return salesStatus; }
    public java.math.BigDecimal getMinAmount() { return minAmount; }
    public java.math.BigDecimal getMaxAmount() { return maxAmount; }
    public java.math.BigDecimal getBaseRate() { return baseRate; }
    public String getDocumentPath() { return documentPath; }
    public String getDocumentName() { return documentName; }

    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
}
