package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loanrate")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanRate {
    
    @Id
    @Column(name = "loanrateid", nullable = false)
    private String loanRateId;
    
    @Column(name = "productid", nullable = false)
    private String productId;
    
    @Column(name = "ratetype")
    private String rateType;
    
    @Column(name = "baserate", precision = 5, scale = 2)
    private BigDecimal baseRate;
    
    @Column(name = "spreadrate", precision = 5, scale = 2)
    private BigDecimal spreadRate;
    
    @Column(name = "bonusrate", precision = 5, scale = 2)
    private BigDecimal bonusRate;
    
    @Column(name = "minrate", precision = 5, scale = 2)
    private BigDecimal minRate;
    
    @Column(name = "maxrate", precision = 5, scale = 2)
    private BigDecimal maxRate;
    
    @Column(name = "ratechangecycle")
    private String rateChangeCycle;
    
    @Column(name = "effectivedate")
    private LocalDate effectiveDate;
}
