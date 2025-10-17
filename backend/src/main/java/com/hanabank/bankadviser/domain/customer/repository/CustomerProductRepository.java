package com.hanabank.bankadviser.domain.customer.repository;

import com.hanabank.bankadviser.domain.customer.entity.CustomerProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerProductRepository extends JpaRepository<CustomerProduct, String> {
    
    @Query("SELECT cp FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId")
    List<CustomerProduct> findByCustomerId(@Param("customerId") String customerId);
    
    // CustomerService에서 사용하는 메서드들 추가
    @Query("SELECT cp FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId")
    List<CustomerProduct> findByCustomerCustomerId(@Param("customerId") String customerId);
    
    @Query("SELECT COALESCE(SUM(cp.balance), 0) FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId AND cp.balance > 0")
    Long getTotalAssetsByCustomerId(@Param("customerId") String customerId);
    
    @Query("SELECT COALESCE(SUM(ABS(cp.balance)), 0) FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId AND cp.balance < 0")
    Long getTotalDebtsByCustomerId(@Param("customerId") String customerId);

    // 최근 가입 이력 우선 정렬: createdAt DESC, enrollmentId tie-breaker
    @Query("SELECT cp FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId ORDER BY cp.createdAt DESC, cp.enrollmentId DESC")
    List<CustomerProduct> findRecentByCustomerId(@Param("customerId") String customerId);

    // 페이지네이션 지원 (키셋으로 대체 가능하지만 우선 Pageable 제공)
    @Query(
        value = "SELECT cp FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId ORDER BY cp.createdAt DESC, cp.enrollmentId DESC",
        countQuery = "SELECT COUNT(cp) FROM CustomerProduct cp WHERE cp.customer.customerId = :customerId"
    )
    Page<CustomerProduct> findPageByCustomerId(@Param("customerId") String customerId, Pageable pageable);
}


