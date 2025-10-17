package com.hanabank.bankadviser.domain.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProductDto {
    
    private Long id;
    private String customerId;
    private String productName;
    private String productType;
    private Long balance;
    private Long monthlyPayment;
    private Double interestRate;
    private String startDate;
    private String maturityDate;
    private String status;
    private LocalDateTime createdAt;
    private String accountNumber;
    private String enrollmentDate;
    private String description;
    private String productId;
}
