package com.hanabank.bankadviser.domain.customer.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "customerproduct")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "customer")
public class CustomerProduct {
    
    @Id
    @Column(name = "enrollmentid")
    private String enrollmentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customerid", referencedColumnName = "customerid")
    @JsonBackReference
    private Customer customer;
    
    @Column(name = "productid", nullable = false)
    private String productId;
    
    @Column(name = "enrollmentdate", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime enrollmentDate;
    
    @Column(name = "maturitydate")
    private String maturityDate;
    
    @Column(name = "currentbalance")
    private Long currentBalance;
    
    @Column(name = "currentappliedrate")
    private Double currentAppliedRate;
    
    @Column(name = "status", nullable = false)
    private String status;
    
    @Column(name = "cancellationdate")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancellationDate;
    
    // 새로 추가된 컬럼들
    @Column(name = "productname")
    private String productName;
    
    @Column(name = "producttype")
    private String productType;
    
    @Column(name = "balance")
    private Long balance;
    
    @Column(name = "monthlypayment")
    private Long monthlyPayment;
    
    @Column(name = "interestrate")
    private Double interestRate;
    
    @Column(name = "startdate")
    private String startDate;
    
    @Column(name = "createdat")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @Column(name = "accountnumber")
    private String accountNumber;
    
    @Column(name = "description")
    private String description;
    
    // 고객 ID를 직접 접근할 수 있도록 추가
    @Transient
    public String getCustomerId() {
        return customer != null ? customer.getCustomerId() : null;
    }
    
    // 기존 코드와의 호환성을 위한 getter 메서드들
    @Transient
    public Long getId() {
        return Long.valueOf(enrollmentId.hashCode());
    }
    
    // Lombok이 제대로 작동하지 않을 경우를 대비한 직접 getter 메서드들
    public String getEnrollmentId() { return enrollmentId; }
    public Customer getCustomer() { return customer; }
    public String getProductName() { return productName; }
    public String getProductType() { return productType; }
    public BigDecimal getAmount() { return BigDecimal.valueOf(currentBalance); }
    public BigDecimal getInterestRate() { return BigDecimal.valueOf(currentAppliedRate); }
    public BigDecimal getMonthlyPayment() { return BigDecimal.valueOf(currentBalance / 12); }
    public LocalDateTime getStartDate() { return LocalDateTime.now(); }
    public LocalDateTime getMaturityDate() { return LocalDateTime.now().plusYears(1); }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getAccountNumber() { return accountNumber; }
    public LocalDateTime getEnrollmentDate() { return enrollmentDate; }
    public String getDescription() { return description; }
    public String getProductId() { return productId; }
    public BigDecimal getBalance() { return BigDecimal.valueOf(currentBalance); }
}
