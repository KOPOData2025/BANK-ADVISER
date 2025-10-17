package com.hanabank.bankadviser.domain.product.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDocument {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "document_name", nullable = false)
    private String documentName;
    
    @Column(name = "storage_path", nullable = false)
    private String storagePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "content_type")
    private String contentType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DocumentStatus status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = DocumentStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum DocumentStatus {
        PENDING, PROCESSING, COMPLETED, ERROR
    }

    // Lombok 미작동 시 대비한 명시적 getter/setter
    public String getDocumentName() { return documentName; }
    public String getStoragePath() { return storagePath; }
    public Long getFileSize() { return fileSize; }
    public String getContentType() { return contentType; }
    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }
}
