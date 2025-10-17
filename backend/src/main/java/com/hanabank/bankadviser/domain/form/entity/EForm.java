package com.hanabank.bankadviser.domain.form.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "eform")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EForm {

    @Id
    @Column(name = "formid")
    private String formId;

    @Column(name = "productid")
    private String productId;

    @Column(name = "formname")
    private String formName;

    @Column(name = "formtype")
    private String formType;

    @Column(name = "formtemplatepath")
    private String formTemplatePath;

    @Column(name = "description")
    private String description;

    @Column(name = "versionnumber")
    private Integer versionNumber;
}


