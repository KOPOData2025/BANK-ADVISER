package com.hanabank.bankadviser.domain.product.repository;

import com.hanabank.bankadviser.domain.product.entity.ProductDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductDocumentRepository extends JpaRepository<ProductDocument, Long> {
    
    List<ProductDocument> findByStatus(ProductDocument.DocumentStatus status);
    
    Optional<ProductDocument> findByDocumentName(String documentName);
    
    Optional<ProductDocument> findByStoragePath(String storagePath);
}
