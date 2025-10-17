package com.hanabank.bankadviser.domain.auth.controller;

import com.hanabank.bankadviser.domain.auth.dto.LoginRequest;
import com.hanabank.bankadviser.domain.auth.dto.LoginResponse;
import com.hanabank.bankadviser.domain.auth.service.AuthService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("로그인 요청: {}", loginRequest.getEmployeeId());
        
        LoginResponse response = authService.login(loginRequest);
        
        if (response.isSuccess()) {
            log.info("로그인 성공: {}", loginRequest.getEmployeeId());
            return ResponseEntity.ok(response);
        } else {
            log.warn("로그인 실패: {} - {}", loginRequest.getEmployeeId(), response.getMessage());
            return ResponseEntity.status(401).body(response);
        }
    }
    
    @GetMapping("/verify")
    public ResponseEntity<LoginResponse> verifyToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(
                    LoginResponse.builder()
                        .success(false)
                        .message("유효하지 않은 토큰 형식입니다.")
                        .build()
                );
            }
            
            String token = authHeader.substring(7);
            
            if (authService.validateToken(token)) {
                return ResponseEntity.ok(
                    LoginResponse.builder()
                        .success(true)
                        .message("유효한 토큰입니다.")
                        .build()
                );
            } else {
                return ResponseEntity.status(401).body(
                    LoginResponse.builder()
                        .success(false)
                        .message("유효하지 않은 토큰입니다.")
                        .build()
                );
            }
        } catch (Exception e) {
            log.error("토큰 검증 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                LoginResponse.builder()
                    .success(false)
                    .message("토큰 검증 중 오류가 발생했습니다.")
                    .build()
            );
        }
    }
}


