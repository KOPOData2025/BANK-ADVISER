package com.hanabank.bankadviser.domain.consultation.entity;

import javax.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "session_history")
public class SessionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @Column(length = 50, nullable = false)
    private String sessionFormId; // FK(SessionForm) 문자형 매핑

    @Column
    private Integer oldStatus;

    @Column
    private Integer newStatus;

    @Column
    private LocalDateTime changeDate;

    @Column(length = 50)
    private String changeByEmployeeId;
}


