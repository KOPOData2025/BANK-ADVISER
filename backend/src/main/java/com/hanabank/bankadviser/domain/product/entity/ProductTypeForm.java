package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_type_form")
public class ProductTypeForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productTypeFormId;

    @Column(length = 50, nullable = false)
    private String productType; // 예: deposit/savings/loan/invest

    @Column(length = 50, nullable = false)
    private String formId; // 연결되는 폼 ID (문자형 매핑)

    @Column
    private Boolean isMandatory; // 해당 상품유형에서 필수 서식인지

    @Column
    private Integer orderSequence; // 표시 순서
}


