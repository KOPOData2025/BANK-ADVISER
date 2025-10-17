package com.hanabank.bankadviser.domain.form.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/api/test-forms")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class TestFormsController {

    @RequestMapping(value = "/ping", method = RequestMethod.GET)
    @ResponseBody
    public String ping() {
        System.out.println("🎯 TestFormsController /ping 엔드포인트 호출됨!");
        return "TestFormsController ping 성공! 🎉";
    }

    @RequestMapping(value = "/by-type", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<ApiResponse<?>> getFormsByType(@RequestParam String type) {
        System.out.println("📋 서식 조회 요청 - type: " + type);
        return ResponseEntity.ok(ApiResponse.success("서식 조회 성공", List.of("테스트 서식 1", "테스트 서식 2")));
    }
}
