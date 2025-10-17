package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "productbenefit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBenefit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "productid")
    private String productId;

    @Column(name = "benefitid")
    private String benefitId;

    @Column(name = "applicablevalue")
    private String applicableValue;

    @Column(name = "applicablecalculationmethod")
    private String applicableCalculationMethod;
}


