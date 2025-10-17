package com.hanabank.bankadviser.domain.document.dto;

public class OCRLoginRequest {
    private String name;
    private String idNumber;

    public OCRLoginRequest() {}

    public OCRLoginRequest(String name, String idNumber) {
        this.name = name;
        this.idNumber = idNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }
}
