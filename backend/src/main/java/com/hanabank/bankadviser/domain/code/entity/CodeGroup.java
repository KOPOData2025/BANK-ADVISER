package com.hanabank.bankadviser.domain.code.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "codegroup")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeGroup {

    @Id
    @Column(name = "codegroupid")
    private String codeGroupId;

    @Column(name = "groupname")
    private String groupName;

    @Column(name = "description")
    private String description;
}


