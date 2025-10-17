package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "eform")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductForm {
    
    @Id
    @Column(name = "formid", nullable = false)
    private String formId;
    
    @Column(name = "formname", nullable = false)
    private String formName;
    
    @Column(name = "formtype", nullable = false)
    private String formType; // 예금, 대출, 적금 등
    
    @Column(name = "formschema", columnDefinition = "JSONB")
    private String formSchema; // 서식 스키마 JSON
    
    @Column(name = "formtemplatepath")
    private String formTemplatePath; // 서식 템플릿 경로
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // 서식 설명
    
    @Column(name = "versionnumber")
    private String versionNumber;
    
    @Column(name = "productid")
    private String productId; // 연결된 상품 ID
    
    @Column(name = "producttype")
    private String productType; // 연결된 상품 타입
}
