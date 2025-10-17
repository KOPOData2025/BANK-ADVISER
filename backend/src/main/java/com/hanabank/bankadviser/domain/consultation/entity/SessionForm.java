package com.hanabank.bankadviser.domain.consultation.entity;

import javax.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessionform")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionForm {

    @Id
    @Column(name = "sessionformid")
    private String sessionFormId;

    @Column(name = "formid")
    private String formId;

    @Column(name = "sessionid")
    private String sessionId;

    @Column(name = "status")
    private String status;

    @Column(name = "starttimestamp")
    private LocalDateTime startTimestamp;

    @Column(name = "endtimestamp")
    private LocalDateTime endTimestamp;

    @Column(name = "lastupdatetimestamp")
    private LocalDateTime lastUpdateTimestamp;

    @Column(name = "filleddata")
    private String filledData;
}


