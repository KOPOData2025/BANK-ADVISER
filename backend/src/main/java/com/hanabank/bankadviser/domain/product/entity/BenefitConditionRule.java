package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "benefitconditionrule")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitConditionRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "benefitid")
    private String benefitId;

    @Column(name = "conditionid")
    private String conditionId;

    @Column(name = "logicoperator")
    private String logicOperator;

    @Column(name = "ismandatory")
    private Boolean isMandatory;
}


