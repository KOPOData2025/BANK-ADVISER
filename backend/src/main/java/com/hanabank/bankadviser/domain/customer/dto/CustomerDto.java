package com.hanabank.bankadviser.domain.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanabank.bankadviser.domain.customer.dto.CustomerProductDto;
import com.hanabank.bankadviser.domain.customer.dto.CustomerProductSummaryDto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class CustomerDto {
    
    private String customerId;
    private String name;
    private LocalDate dateOfBirth;
    private String contactNumber;
    private String address;
    private String gender;
    private LocalDateTime registrationDate;
    
    // 급여통장 여부
    private Boolean salaryAccount;
    
    // 포트폴리오 시각화를 위한 필드들
    private BigDecimal totalAssets;
    private BigDecimal monthlyIncome;
    private String investmentGoal;
    private String riskTolerance;
    private Integer investmentPeriod;
    private String portfolioAllocation;
    private Integer financialHealthScore;
    private LocalDateTime lastPortfolioUpdate;
    
    private Integer age;
    private String phone; 
    private String militaryStatus;
    private String militaryId;     
    private String militaryBranch; 
    private Boolean hasChildren;   
    private String employmentStatus; 
    
    // 고객 보유 상품 정보
    @JsonProperty("products")
    private List<CustomerProductDto> products = new ArrayList<>();
    
    // 상품 요약 정보
    @JsonProperty("productSummary")
    private CustomerProductSummaryDto productSummary = new CustomerProductSummaryDto();
    
    public List<CustomerProductDto> getProducts() {
        return products;
    }
    
    public void setProducts(List<CustomerProductDto> products) {
        this.products = products;
    }
    
    public CustomerProductSummaryDto getProductSummary() {
        return productSummary;
    }
    
    public void setProductSummary(CustomerProductSummaryDto productSummary) {
        this.productSummary = productSummary;
    }

    //서비스 검증 로직
    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getContactNumber() { return contactNumber; }
    public String getAddress() { return address; }
    public String getGender() { return gender; }
    public java.time.LocalDateTime getRegistrationDate() { return registrationDate; }
    public java.math.BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public String getMilitaryStatus() { return militaryStatus; }
}


