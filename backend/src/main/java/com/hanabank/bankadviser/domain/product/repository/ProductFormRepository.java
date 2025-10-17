package com.hanabank.bankadviser.domain.product.repository;

import com.hanabank.bankadviser.domain.product.entity.ProductForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductFormRepository extends JpaRepository<ProductForm, String> {
    
    List<ProductForm> findByFormType(String formType);
    
    List<ProductForm> findByProductType(String productType);
    
    List<ProductForm> findByProductId(String productId);
    
    @Query("SELECT pf FROM ProductForm pf WHERE pf.productType = :productType OR pf.productId = :productId")
    List<ProductForm> findByProductTypeOrProductId(@Param("productType") String productType, @Param("productId") String productId);
    
    @Query("SELECT pf FROM ProductForm pf WHERE pf.formType = :formType AND (pf.productType = :productType OR pf.productId = :productId)")
    List<ProductForm> findByFormTypeAndProductTypeOrProductId(@Param("formType") String formType, @Param("productType") String productType, @Param("productId") String productId);
}
