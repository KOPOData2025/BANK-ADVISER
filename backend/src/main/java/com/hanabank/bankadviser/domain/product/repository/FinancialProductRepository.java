package com.hanabank.bankadviser.domain.product.repository;

import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialProductRepository extends JpaRepository<FinancialProduct, String> {
    
    List<FinancialProduct> findByProductType(String productType);
    
    @Query("SELECT fp FROM FinancialProduct fp WHERE " +
           "LOWER(fp.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(fp.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<FinancialProduct> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT DISTINCT fp.productType FROM FinancialProduct fp WHERE fp.productType IS NOT NULL")
    List<String> findAllProductTypes();
    
    /**
     * 판매 상태별 상품 조회 (기본금리 내림차순)
     */
    List<FinancialProduct> findBySalesStatusOrderByBaseRateDesc(String salesStatus, org.springframework.data.domain.Pageable pageable);
    
    /**
     * 판매 상태별 상품 조회 (기본금리 내림차순) - 제한된 개수
     */
    @Query(value = "SELECT * FROM product WHERE salesstatus = :salesStatus ORDER BY baserate DESC LIMIT :limit", nativeQuery = true)
    List<FinancialProduct> findBySalesStatusOrderByBaseRateDesc(@Param("salesStatus") String salesStatus, @Param("limit") int limit);
    
    /**
     * 상품명으로 정확히 일치하는 상품 조회 (크롤링 시 중복 체크용)
     */
    List<FinancialProduct> findByProductName(String productName);
}


