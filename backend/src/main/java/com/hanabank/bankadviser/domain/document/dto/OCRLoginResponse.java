package com.hanabank.bankadviser.domain.document.dto;

public class OCRLoginResponse {
    private boolean success;
    private String message;
    private String customerId;
    private String customerName;
    private String extractedName;
    private String extractedIdNumber;
    private String token;

    public OCRLoginResponse() {}

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getExtractedName() {
        return extractedName;
    }

    public void setExtractedName(String extractedName) {
        this.extractedName = extractedName;
    }

    public String getExtractedIdNumber() {
        return extractedIdNumber;
    }

    public void setExtractedIdNumber(String extractedIdNumber) {
        this.extractedIdNumber = extractedIdNumber;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
