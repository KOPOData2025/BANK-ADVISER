package com.hanabank.bankadviser.domain.consultation.repository;

import com.hanabank.bankadviser.domain.consultation.entity.ConsultationSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, Long> {
    
    Optional<ConsultationSession> findBySessionId(String sessionId);
    
    List<ConsultationSession> findByEmployeeId(String employeeId);
    
    List<ConsultationSession> findByStatus(String status);
    
    List<ConsultationSession> findByEmployeeIdAndStatus(String employeeId, String status);
    
    // 고객 ID로 상담 세션 조회 (정렬 포함)
    List<ConsultationSession> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    
    // 고객 ID로 페이지네이션된 상담 세션 조회
    Page<ConsultationSession> findByCustomerId(String customerId, Pageable pageable);
}


