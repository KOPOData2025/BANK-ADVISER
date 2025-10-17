package com.hanabank.bankadviser.domain.customer.entity;

import javax.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customerconditionstatus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerConditionStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conditionid")
    private String conditionId;

    @Column(name = "customerid")
    private String customerId;

    @Column(name = "isok")
    private Boolean isOk;

    @Column(name = "lastevaluateddate")
    private LocalDateTime lastEvaluatedDate;
}


