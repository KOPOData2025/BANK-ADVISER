package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "productrate")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRate {
    
    @Id
    @Column(name = "rateid", nullable = false)
    private String rateId;
    
    @Column(name = "productid", nullable = false)
    private String productId;
    
    @Column(name = "period")
    private String period;
    
    @Column(name = "baserate", precision = 5, scale = 2)
    private BigDecimal baseRate;
    
    @Column(name = "bonusrate", precision = 5, scale = 2)
    private BigDecimal bonusRate;
    
    @Column(name = "totalrate", precision = 5, scale = 2)
    private BigDecimal totalRate;
    
    @Column(name = "minamount")
    private Long minAmount;
    
    @Column(name = "maxamount")
    private Long maxAmount;
    
    @Column(name = "effectivedate")
    private LocalDate effectiveDate;
}
