package com.hanabank.bankadviser.domain.product.repository;

import com.hanabank.bankadviser.domain.product.entity.LoanRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRateRepository extends JpaRepository<LoanRate, String> {
    
    List<LoanRate> findByProductId(String productId);
    
    @Query("SELECT lr FROM LoanRate lr WHERE lr.productId = :productId AND lr.rateType = :rateType")
    List<LoanRate> findByProductIdAndRateType(@Param("productId") String productId, @Param("rateType") String rateType);
}
