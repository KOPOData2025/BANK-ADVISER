package com.hanabank.bankadviser.domain.auth.dto;

import javax.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "직원 ID는 필수입니다")
    private String employeeId;
    
    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;
}


