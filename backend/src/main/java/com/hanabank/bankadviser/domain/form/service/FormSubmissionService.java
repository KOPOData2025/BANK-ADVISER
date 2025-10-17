package com.hanabank.bankadviser.domain.form.service;

import com.hanabank.bankadviser.domain.form.entity.FormSubmission;
import com.hanabank.bankadviser.domain.form.repository.FormSubmissionRepository;
import com.hanabank.bankadviser.domain.form.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormSubmissionService {
    
    private final FormSubmissionRepository formSubmissionRepository;
    private final SupabaseStorageService supabaseStorageService;
    
    /**
     * 서식 제출 데이터 저장 (캐시 무효화) - PWA 네트워크 불안정 대응 재시도 로직
     */
    @Transactional(rollbackFor = Exception.class, timeout = 60)
    @CacheEvict(value = {"formSchema", "customerProfile"}, allEntries = true)
    public FormSubmission saveFormSubmission(FormSubmission formSubmission) {
        int maxRetries = 3;
        int retryDelay = 1000; // 1초
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("서식 저장 시도 {}/{}: customerId={}, formName={}", 
                        attempt, maxRetries, formSubmission.getCustomerId(), formSubmission.getFormName());
                
                // submissionId가 없으면 생성
                if (formSubmission.getSubmissionId() == null || formSubmission.getSubmissionId().isEmpty()) {
                    formSubmission.setSubmissionId(generateSubmissionId());
                }
                
                // 상태가 없으면 DRAFT로 설정
                if (formSubmission.getStatus() == null || formSubmission.getStatus().isEmpty()) {
                    formSubmission.setStatus("DRAFT");
                }
                
                // 완성도가 없으면 0으로 설정
                if (formSubmission.getCompletionRate() == null) {
                    formSubmission.setCompletionRate(0);
                }
                
                // 현재 시간 설정
                formSubmission.setCreatedAt(java.time.LocalDateTime.now());
                formSubmission.setUpdatedAt(java.time.LocalDateTime.now());
                
                // COMPLETED 상태인 경우 submittedAt 설정
                if ("COMPLETED".equals(formSubmission.getStatus())) {
                    formSubmission.setSubmittedAt(java.time.LocalDateTime.now());
                }
                
                FormSubmission saved = formSubmissionRepository.save(formSubmission);
                log.info("✅ 서식 제출 데이터 저장 완료 (시도 {}/{}): submissionId={}, formName={}", 
                        attempt, maxRetries, saved.getSubmissionId(), saved.getFormName());
                return saved;
                
            } catch (Exception e) {
                log.warn("⚠️ 서식 저장 시도 {}/{} 실패: {}", attempt, maxRetries, e.getMessage());
                
                if (attempt == maxRetries) {
                    log.error("❌ 서식 제출 데이터 저장 최종 실패 ({}회 시도): {}", maxRetries, e.getMessage(), e);
                    throw new RuntimeException("서식 저장에 실패했습니다: " + e.getMessage());
                }
                
                // 재시도 전 대기
                try {
                    Thread.sleep(retryDelay * attempt); // 지수 백오프
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("서식 저장 중 중단됨: " + ie.getMessage());
                }
            }
        }
        
        throw new RuntimeException("서식 저장에 실패했습니다: 최대 재시도 횟수 초과");
    }
    
    /**
     * 서식 제출 데이터 업데이트
     */
    @Transactional
    public FormSubmission updateFormSubmission(String submissionId, FormSubmission updatedData) {
        try {
            Optional<FormSubmission> existingOpt = formSubmissionRepository.findBySubmissionId(submissionId);
            if (existingOpt.isEmpty()) {
                throw new RuntimeException("서식 제출 데이터를 찾을 수 없습니다: " + submissionId);
            }
            
            FormSubmission existing = existingOpt.get();
            
            // 업데이트할 필드들
            if (updatedData.getFormData() != null) {
                existing.setFormData(updatedData.getFormData());
            }
            if (updatedData.getCompletionRate() != null) {
                existing.setCompletionRate(updatedData.getCompletionRate());
            }
            if (updatedData.getStatus() != null) {
                existing.setStatus(updatedData.getStatus());
            }
            if (updatedData.getSubmittedAt() != null) {
                existing.setSubmittedAt(updatedData.getSubmittedAt());
            }
            
            FormSubmission saved = formSubmissionRepository.save(existing);
            log.info("서식 제출 데이터 업데이트 완료: submissionId={}", saved.getSubmissionId());
            return saved;
            
        } catch (Exception e) {
            log.error("서식 제출 데이터 업데이트 실패: {}", e.getMessage(), e);
            throw new RuntimeException("서식 업데이트에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 서식 제출 완료 처리
     */
    @Transactional
    public FormSubmission submitForm(String submissionId) {
        try {
            Optional<FormSubmission> existingOpt = formSubmissionRepository.findBySubmissionId(submissionId);
            if (existingOpt.isEmpty()) {
                throw new RuntimeException("서식 제출 데이터를 찾을 수 없습니다: " + submissionId);
            }
            
            FormSubmission existing = existingOpt.get();
            existing.setStatus("SUBMITTED");
            existing.setSubmittedAt(LocalDateTime.now());
            
            FormSubmission saved = formSubmissionRepository.save(existing);
            log.info("서식 제출 완료 처리: submissionId={}", saved.getSubmissionId());
            return saved;
            
        } catch (Exception e) {
            log.error("서식 제출 완료 처리 실패: {}", e.getMessage(), e);
            throw new RuntimeException("서식 제출에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 제출 ID로 조회 (캐싱 적용) - 서식 2000개 처리 핵심!
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "formSchema", key = "'submission_' + #submissionId")
    public Optional<FormSubmission> findBySubmissionId(String submissionId) {
        log.info("🚀 [캐시 미스] 서식 제출 데이터 DB 조회: {}", submissionId);
        return formSubmissionRepository.findBySubmissionId(submissionId);
    }
    
    /**
     * 고객 ID로 조회 (캐싱 적용)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "formSchema", key = "'customer_' + #customerId")
    public List<FormSubmission> findByCustomerId(String customerId) {
        log.info("🚀 [캐시 미스] 고객별 서식 제출 데이터 DB 조회: {}", customerId);
        return formSubmissionRepository.findByCustomerId(customerId);
    }
    
    /**
     * 직원 ID로 조회
     */
    @Transactional(readOnly = true)
    public List<FormSubmission> findByEmployeeId(String employeeId) {
        return formSubmissionRepository.findByEmployeeId(employeeId);
    }
    
    /**
     * 최근 제출된 서식 조회
     */
    @Transactional(readOnly = true)
    public List<FormSubmission> findRecentSubmissions() {
        return formSubmissionRepository.findRecentSubmissions();
    }
    
    /**
     * 파일과 함께 서식 제출 데이터 저장
     */
    @Transactional(rollbackFor = Exception.class)
    public FormSubmission saveFormSubmissionWithFiles(FormSubmission formSubmission, 
                                                     MultipartFile screenshotFile, 
                                                     Object jsonData) {
        try {
            // submissionId가 없으면 생성
            if (formSubmission.getSubmissionId() == null || formSubmission.getSubmissionId().isEmpty()) {
                formSubmission.setSubmissionId(generateSubmissionId());
            }
            
            // 상태가 없으면 DRAFT로 설정
            if (formSubmission.getStatus() == null || formSubmission.getStatus().isEmpty()) {
                formSubmission.setStatus("DRAFT");
            }
            
            // 완성도가 없으면 0으로 설정
            if (formSubmission.getCompletionRate() == null) {
                formSubmission.setCompletionRate(0);
            }
            
            // 파일 업로드
            String bucketName = "form-submissions";
            String baseFileName = supabaseStorageService.generateUniqueFileName(
                formSubmission.getCustomerId(), 
                formSubmission.getFormName(), 
                ""
            );
            
            // 스크린샷 파일 업로드
            if (screenshotFile != null && !screenshotFile.isEmpty()) {
                String screenshotFileName = baseFileName + "_screenshot.png";
                String screenshotUrl = supabaseStorageService.uploadFile(screenshotFile, bucketName, screenshotFileName);
                formSubmission.setScreenshotUrl(screenshotUrl);
                log.info("스크린샷 파일 업로드 완료: {}", screenshotUrl);
            }
            
            // JSON 데이터 업로드
            if (jsonData != null) {
                String jsonFileName = baseFileName + "_data.json";
                String jsonFileUrl = supabaseStorageService.uploadJsonData(jsonData, bucketName, jsonFileName);
                formSubmission.setJsonFileUrl(jsonFileUrl);
                log.info("JSON 파일 업로드 완료: {}", jsonFileUrl);
            }
            
            // 현재 시간 설정
            formSubmission.setCreatedAt(java.time.LocalDateTime.now());
            formSubmission.setUpdatedAt(java.time.LocalDateTime.now());
            
            FormSubmission saved = formSubmissionRepository.save(formSubmission);
            log.info("서식 제출 데이터 및 파일 저장 완료: submissionId={}, formName={}", 
                    saved.getSubmissionId(), saved.getFormName());
            return saved;
            
        } catch (Exception e) {
            log.error("서식 제출 데이터 및 파일 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("서식 및 파일 저장에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고유한 제출 ID 생성
     */
    private String generateSubmissionId() {
        return "SUB_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
