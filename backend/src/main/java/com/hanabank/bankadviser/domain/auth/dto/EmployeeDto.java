package com.hanabank.bankadviser.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDto {
    
    private String id;
    private String employeeId;
    private String name;
    private String department;
    private String position;
}


