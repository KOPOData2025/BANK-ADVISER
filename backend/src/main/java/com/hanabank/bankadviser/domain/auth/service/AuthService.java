package com.hanabank.bankadviser.domain.auth.service;

import com.hanabank.bankadviser.domain.auth.dto.EmployeeDto;
import com.hanabank.bankadviser.domain.auth.dto.LoginRequest;
import com.hanabank.bankadviser.domain.auth.dto.LoginResponse;
import com.hanabank.bankadviser.domain.auth.entity.Employee;
import com.hanabank.bankadviser.domain.auth.repository.EmployeeRepository;
import com.hanabank.bankadviser.domain.consultation.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final EmployeeRepository employeeRepository;
    private final JwtService jwtService;
    private final SessionService sessionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public LoginResponse login(LoginRequest loginRequest) {
        try {
            Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(loginRequest.getEmployeeId());
            
            if (employeeOpt.isEmpty()) {
                return LoginResponse.builder()
                        .success(false)
                        .message("존재하지 않는 직원 ID입니다.")
                        .build();
            }
            
            Employee employee = employeeOpt.get();
            
            // 비밀번호 검증 (BCrypt 해시 비교)
            if (employee.getPasswordHash() == null || !passwordEncoder.matches(loginRequest.getPassword(), employee.getPasswordHash())) {
                return new LoginResponse(false, "비밀번호가 일치하지 않습니다.", null, null, null);
            }
            
            // JWT 토큰 생성
            String token = jwtService.generateToken(employee.getEmployeeId());
            
            // 행원 세션 생성
            String sessionId = sessionService.createEmployeeSession(employee.getEmployeeId(), employee.getName());
            
            // EmployeeDto 생성
            EmployeeDto employeeDto = EmployeeDto.builder()
                    .id(employee.getEmployeeId())
                    .employeeId(employee.getEmployeeId())
                    .name(employee.getName())
                    .department(employee.getDepartment())
                    .position(employee.getPosition())
                    .build();
            
            return LoginResponse.builder()
                    .success(true)
                    .message("로그인 성공")
                    .token(token)
                    .employee(employeeDto)
                    .sessionId(sessionId)  // 세션 ID 추가
                    .build();
                    
        } catch (Exception e) {
            log.error("로그인 처리 중 오류 발생", e);
            return LoginResponse.builder()
                    .success(false)
                    .message("로그인 처리 중 오류가 발생했습니다.")
                    .build();
        }
    }
    
    public boolean validateToken(String token) {
        return jwtService.validateToken(token);
    }
    
    public String getEmployeeIdFromToken(String token) {
        return jwtService.getEmployeeIdFromToken(token);
    }
}


