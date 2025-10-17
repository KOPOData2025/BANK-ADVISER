package com.hanabank.bankadviser.domain.document.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "embeddings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Embedding {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "document_id", nullable = false)
    private String documentId;
    
    @Column(name = "chunk_id", nullable = false)
    private String chunkId;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(columnDefinition = "TEXT")
    private String embedding; // Will be stored as JSON string for H2 compatibility
    
    @Column(columnDefinition = "TEXT")
    private String metadata; // Will be stored as JSON string for H2 compatibility
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
