package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "condition")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Condition {
    @Id
    @Column(name = "conditionid")
    private String conditionId;

    @Column(name = "conditionname")
    private String conditionName;

    @Column(name = "conditiontype")
    private String conditionType;

    @Column(name = "parameterjson", columnDefinition = "TEXT")
    private String parameterJson;

    @Column(name = "description")
    private String description;
}


