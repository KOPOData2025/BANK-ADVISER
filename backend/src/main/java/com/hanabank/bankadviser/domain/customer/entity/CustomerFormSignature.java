package com.hanabank.bankadviser.domain.customer.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "customerformsignature")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFormSignature {
    
    @Id
    @Column(name = "signatureid", unique = true, nullable = false)
    private String signatureId;
    
    @Column(name = "sessionformid")
    private String sessionFormId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customerid", referencedColumnName = "customerid")
    private Customer customer;
    
    @Column(name = "signaturedatetime", nullable = false)
    private LocalDateTime signatureDateTime;
    
    @Column(name = "signaturedata", columnDefinition = "TEXT", nullable = false)
    private String signatureData;
    
    @Column(name = "signaturematchrate")
    private BigDecimal signatureMatchRate;
    
    @Column(name = "issignaturevalid")
    private Boolean isSignatureValid;
}
