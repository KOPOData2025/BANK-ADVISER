package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "productapplication")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductApplication {
    @Id
    @Column(name = "applicationid")
    private String applicationId;

    @Column(name = "productid")
    private String productId;

    @Column(name = "customerid")
    private String customerId;

    @Column(name = "employeeid")
    private String employeeId;

    @Column(name = "finalsessionformid")
    private String finalSessionFormId;

    @Column(name = "applicationscore")
    private Integer applicationScore;

    @Column(name = "applicationstatus")
    private String applicationStatus;

    @Column(name = "signeddocumentpath")
    private String signedDocumentPath;

    @Column(name = "createdat")
    private LocalDateTime createdAt;
}


