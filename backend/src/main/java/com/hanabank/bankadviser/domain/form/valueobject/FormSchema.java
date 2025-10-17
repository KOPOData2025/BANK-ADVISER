package com.hanabank.bankadviser.domain.form.valueobject;

import lombok.Value;

@Value
public class FormSchema {
    private final String value;
    
    public FormSchema(String value) {
        this.value = value;
    }
    
    public static FormSchema of(String value) {
        return new FormSchema(value);
    }
    
    public boolean hasSchema() {
        return value != null && !value.trim().isEmpty();
    }
    
    public String getJsonValue() {
        return value;
    }
}
