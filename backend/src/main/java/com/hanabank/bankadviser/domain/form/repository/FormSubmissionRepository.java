package com.hanabank.bankadviser.domain.form.repository;

import com.hanabank.bankadviser.domain.form.entity.FormSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormSubmissionRepository extends JpaRepository<FormSubmission, Long> {
    
    // 제출 ID로 조회
    Optional<FormSubmission> findBySubmissionId(String submissionId);
    
    // 고객 ID로 조회
    List<FormSubmission> findByCustomerId(String customerId);
    
    // 직원 ID로 조회
    List<FormSubmission> findByEmployeeId(String employeeId);
    
    // 상품 ID로 조회
    List<FormSubmission> findByProductId(String productId);
    
    // 상태로 조회
    List<FormSubmission> findByStatus(String status);
    
    // 고객 ID와 상태로 조회
    List<FormSubmission> findByCustomerIdAndStatus(String customerId, String status);
    
    // 직원 ID와 상태로 조회
    List<FormSubmission> findByEmployeeIdAndStatus(String employeeId, String status);
    
    // 최근 제출된 서식 조회 (최대 10개)
    @Query("SELECT fs FROM FormSubmission fs ORDER BY fs.createdAt DESC")
    List<FormSubmission> findRecentSubmissions();
    
    // 특정 기간 내 제출된 서식 조회
    @Query("SELECT fs FROM FormSubmission fs WHERE fs.createdAt BETWEEN :startDate AND :endDate ORDER BY fs.createdAt DESC")
    List<FormSubmission> findByDateRange(@Param("startDate") java.time.LocalDateTime startDate, 
                                        @Param("endDate") java.time.LocalDateTime endDate);
}

