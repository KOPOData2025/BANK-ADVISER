package com.hanabank.bankadviser.domain.consultation.repository;

import com.hanabank.bankadviser.domain.consultation.entity.ConsultationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationHistoryRepository extends JpaRepository<ConsultationHistory, Long> {
    
    List<ConsultationHistory> findByCustomerId(String customerId);
    
    List<ConsultationHistory> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    
    List<ConsultationHistory> findByEmployeeId(String employeeId);
    
    List<ConsultationHistory> findByConsultationType(String consultationType);
    
    List<ConsultationHistory> findByStatus(String status);
    
    Optional<ConsultationHistory> findBySessionId(String sessionId);
    
    @Query("SELECT ch FROM ConsultationHistory ch WHERE ch.customerId = :customerId AND ch.status = 'completed' ORDER BY ch.createdAt DESC")
    List<ConsultationHistory> findCompletedConsultationsByCustomerId(@Param("customerId") String customerId);
    
    @Query("SELECT ch FROM ConsultationHistory ch WHERE ch.consultationText LIKE %:keyword% OR ch.customerNeeds LIKE %:keyword% OR ch.consultationSummary LIKE %:keyword%")
    List<ConsultationHistory> findByTextContentContaining(@Param("keyword") String keyword);
}