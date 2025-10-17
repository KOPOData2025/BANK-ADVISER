package com.hanabank.bankadviser.domain.document.controller;

import com.hanabank.bankadviser.domain.document.dto.OCRLoginRequest;
import com.hanabank.bankadviser.domain.document.dto.OCRLoginResponse;
import com.hanabank.bankadviser.domain.document.service.OCRService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "*")
public class OcrController {

    @Autowired
    private OCRService ocrService;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        try {
            String result = ocrService.test();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok("OCR Controller is working! (Service error: " + e.getMessage() + ")");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<OCRLoginResponse> loginWithIDCard(@RequestParam("file") MultipartFile file) {
        try {
            OCRLoginResponse response = ocrService.processIDCardAndLogin(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            OCRLoginResponse errorResponse = new OCRLoginResponse();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("OCR 처리 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/id-card")
    public ResponseEntity<Map<String, Object>> processIDCard(@RequestParam(value = "idCard", required = false) MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "파일이 제공되지 않았습니다."
                ));
            }
            
            Map<String, Object> result = ocrService.extractIDCardInfo(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "OCR 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractIDCardInfo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> extractedInfo = ocrService.extractIDCardInfo(file);
            return ResponseEntity.ok(extractedInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "OCR 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}