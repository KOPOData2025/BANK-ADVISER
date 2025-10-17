package com.hanabank.bankadviser.domain.form.controller;

import com.hanabank.bankadviser.domain.form.entity.FormSubmission;
import com.hanabank.bankadviser.domain.form.service.FormSubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/form-submission")
@RequiredArgsConstructor
@Slf4j
public class FormSubmissionController {
    
    private final FormSubmissionService formSubmissionService;
    
    /**
     * 서식 제출 데이터 저장
     */
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveFormSubmission(@RequestBody FormSubmission formSubmission) {
        try {
            log.info("서식 저장 요청: customerId={}, formName={}", 
                    formSubmission.getCustomerId(), formSubmission.getFormName());
            
            FormSubmission saved = formSubmissionService.saveFormSubmission(formSubmission);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "서식이 성공적으로 저장되었습니다.");
            response.put("data", saved);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("서식 저장 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 저장에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 서식 제출 데이터 업데이트
     */
    @PutMapping("/update/{submissionId}")
    public ResponseEntity<Map<String, Object>> updateFormSubmission(
            @PathVariable String submissionId, 
            @RequestBody FormSubmission updatedData) {
        try {
            log.info("서식 업데이트 요청: submissionId={}", submissionId);
            
            FormSubmission updated = formSubmissionService.updateFormSubmission(submissionId, updatedData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "서식이 성공적으로 업데이트되었습니다.");
            response.put("data", updated);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("서식 업데이트 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 업데이트에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 서식 제출 완료 처리
     */
    @PostMapping("/submit/{submissionId}")
    public ResponseEntity<Map<String, Object>> submitForm(@PathVariable String submissionId) {
        try {
            log.info("서식 제출 완료 요청: submissionId={}", submissionId);
            
            FormSubmission submitted = formSubmissionService.submitForm(submissionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "서식이 성공적으로 제출되었습니다.");
            response.put("data", submitted);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("서식 제출 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 제출에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 제출 ID로 서식 조회
     */
    @GetMapping("/{submissionId}")
    public ResponseEntity<Map<String, Object>> getFormSubmission(@PathVariable String submissionId) {
        try {
            Optional<FormSubmission> formSubmission = formSubmissionService.findBySubmissionId(submissionId);
            
            Map<String, Object> response = new HashMap<>();
            if (formSubmission.isPresent()) {
                response.put("success", true);
                response.put("data", formSubmission.get());
            } else {
                response.put("success", false);
                response.put("message", "서식을 찾을 수 없습니다.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("서식 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 고객 ID로 서식 목록 조회
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getFormSubmissionsByCustomer(@PathVariable String customerId) {
        try {
            List<FormSubmission> submissions = formSubmissionService.findByCustomerId(customerId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", submissions);
            response.put("count", submissions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("고객 서식 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 직원 ID로 서식 목록 조회
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Map<String, Object>> getFormSubmissionsByEmployee(@PathVariable String employeeId) {
        try {
            List<FormSubmission> submissions = formSubmissionService.findByEmployeeId(employeeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", submissions);
            response.put("count", submissions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("직원 서식 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 최근 제출된 서식 목록 조회
     */
    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> getRecentFormSubmissions() {
        try {
            List<FormSubmission> submissions = formSubmissionService.findRecentSubmissions();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", submissions);
            response.put("count", submissions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("최근 서식 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 파일과 함께 서식 제출 데이터 저장
     */
    @PostMapping("/save-with-files")
    public ResponseEntity<Map<String, Object>> saveFormSubmissionWithFiles(
            @RequestParam("screenshot") MultipartFile screenshotFile,
            @RequestParam("formData") String formDataJson,
            @RequestParam("customerId") String customerId,
            @RequestParam("employeeId") String employeeId,
            @RequestParam("productId") String productId,
            @RequestParam("productName") String productName,
            @RequestParam("formId") String formId,
            @RequestParam("formName") String formName,
            @RequestParam("formType") String formType,
            @RequestParam("completionRate") Integer completionRate) {
        try {
            log.info("파일과 함께 서식 저장 요청: customerId={}, formName={}", customerId, formName);
            
            // FormSubmission 객체 생성
            FormSubmission formSubmission = FormSubmission.builder()
                    .customerId(customerId)
                    .employeeId(employeeId)
                    .productId(productId)
                    .productName(productName)
                    .formId(formId)
                    .formName(formName)
                    .formType(formType)
                    .formData(formDataJson)
                    .completionRate(completionRate)
                    .build();
            
            // JSON 데이터 파싱
            Object jsonData = null;
            try {
                jsonData = new com.fasterxml.jackson.databind.ObjectMapper().readValue(formDataJson, Object.class);
            } catch (Exception e) {
                log.warn("JSON 데이터 파싱 실패, 원본 문자열 사용: {}", e.getMessage());
                jsonData = formDataJson;
            }
            
            FormSubmission saved = formSubmissionService.saveFormSubmissionWithFiles(
                    formSubmission, screenshotFile, jsonData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "서식과 파일이 성공적으로 저장되었습니다.");
            response.put("data", saved);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("파일과 함께 서식 저장 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "서식 및 파일 저장에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
