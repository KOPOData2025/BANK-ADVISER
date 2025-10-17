package com.hanabank.bankadviser.domain.customer.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileRequest {
    
    private String customerId;
    private String name;
    private String dateOfBirth;
    private String gender;
    private Integer monthlyIncome;
    private Long totalAssets;
    private String investmentGoal;
    private String riskTolerance;
    private Integer investmentPeriod;
    private Boolean hasSalaryAccount;
    private Boolean isFirstTimeCustomer;
    private Boolean hasExistingProducts;
    private List<String> existingProductTypes;
    private String preferredProductType;
    private Long targetAmount;
    private Integer targetPeriod;
}
