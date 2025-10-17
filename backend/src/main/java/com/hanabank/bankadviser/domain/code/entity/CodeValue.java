package com.hanabank.bankadviser.domain.code.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "codevalue")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeValue {

    @Id
    @Column(name = "codevalueid")
    private String codeValueId;

    @Column(name = "codegroupid")
    private String codeGroupId;

    @Column(name = "codevalue")
    private String codeValue;

    @Column(name = "isactive")
    private Boolean isActive;
}


