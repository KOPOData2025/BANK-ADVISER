package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_report_summary")
public class ProductReportSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long summaryId;

    @Column(nullable = false)
    private LocalDate reportPeriod; // 일/주/월 단위 집계 기간의 시작일

    @Column(length = 50)
    private String productType; // 예금/적금/대출/투자 등

    @Column
    private Integer totalApplications; // 접수 건수

    @Column
    private Integer approvedApplications; // 승인 건수

    @Column
    private Double approvalRate; // 승인율(파생)

    @Column
    private Double averageBenefit; // 평균 혜택(선택)

    @Column(length = 100)
    private String productId; // FK (문자형 ID 매핑)
}


