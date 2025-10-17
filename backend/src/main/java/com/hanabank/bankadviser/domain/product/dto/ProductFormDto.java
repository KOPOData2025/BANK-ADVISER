package com.hanabank.bankadviser.domain.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFormDto {
    private String id;
    private String formType;
    private String formName;
    private String formTemplate;
    private String description;
    private String productId;
    private String productType;
}
