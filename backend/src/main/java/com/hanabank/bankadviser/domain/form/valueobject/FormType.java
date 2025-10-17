package com.hanabank.bankadviser.domain.form.valueobject;

import lombok.Value;

@Value
public class FormType {
    private final String value;
    
    public FormType(String value) {
        this.value = value;
    }
}
