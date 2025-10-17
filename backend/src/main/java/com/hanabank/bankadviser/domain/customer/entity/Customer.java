package com.hanabank.bankadviser.domain.customer.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "customerProducts")
@EqualsAndHashCode(of = "customerId")
public class Customer {
    
    @Id
    @Column(name = "customerid", unique = true, nullable = false)
    private String customerId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "dateofbirth")
    private LocalDate dateOfBirth;
    
    @Column(name = "contactnumber")
    private String contactNumber;
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "gender")
    private String gender;
    
    @Column(name = "registrationdate")
    private LocalDateTime registrationDate;
    
    // 포트폴리오 시각화를 위한 컬럼들
    @Column(name = "total_assets")
    private BigDecimal totalAssets;
    
    @Column(name = "monthly_income")
    private BigDecimal monthlyIncome;
    
    @Column(name = "investment_goal")
    private String investmentGoal;
    
    @Column(name = "risk_tolerance")
    private String riskTolerance;
    
    @Column(name = "investment_period")
    private Integer investmentPeriod;
    
    @Column(name = "portfolio_allocation", columnDefinition = "jsonb")
    private String portfolioAllocation;
    
    @Column(name = "financial_health_score")
    private Integer financialHealthScore;
    
    @Column(name = "last_portfolio_update")
    private LocalDateTime lastPortfolioUpdate;
    
    // 급여통장 여부 (DB에 실제로 존재하지 않으므로 항상 false 반환)
    @Transient
    public Boolean getSalaryAccount() {
        return false;
    }
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<CustomerProduct> customerProducts;
    
    // Lombok이 제대로 작동하지 않을 경우를 대비한 직접 getter 메서드들
    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getContactNumber() { return contactNumber; }
    public String getAddress() { return address; }
    public String getGender() { return gender; }
    public LocalDateTime getRegistrationDate() { return registrationDate; }
    public BigDecimal getTotalAssets() { return totalAssets; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public String getInvestmentGoal() { return investmentGoal; }
    public String getRiskTolerance() { return riskTolerance; }
    public Integer getInvestmentPeriod() { return investmentPeriod; }
    public String getPortfolioAllocation() { return portfolioAllocation; }
    public Integer getFinancialHealthScore() { return financialHealthScore; }
    public LocalDateTime getLastPortfolioUpdate() { return lastPortfolioUpdate; }
    public List<CustomerProduct> getCustomerProducts() { return customerProducts; }
}
