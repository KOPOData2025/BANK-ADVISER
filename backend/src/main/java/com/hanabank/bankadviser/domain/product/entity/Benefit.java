package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "benefit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Benefit {
    @Id
    @Column(name = "benefitid")
    private String benefitId;

    @Column(name = "benefittype")
    private String benefitType;

    @Column(name = "benefitname")
    private String benefitName;

    @Column(name = "valuetype")
    private String valueType;

    @Column(name = "defaultvalue")
    private String defaultValue;

    @Column(name = "description")
    private String description;
}


