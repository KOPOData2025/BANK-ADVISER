package com.hanabank.bankadviser.domain.form.valueobject;

import lombok.Value;

@Value
public class FormId {
    private final String value;
    
    public FormId(String value) {
        this.value = value;
    }
}
