package com.hanabank.bankadviser.domain.document.repository;

import com.hanabank.bankadviser.domain.document.entity.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmbeddingRepository extends JpaRepository<Embedding, Long> {
    
    List<Embedding> findByDocumentId(String documentId);
    
    @Query(value = "SELECT * FROM embeddings WHERE document_id = :documentId ORDER BY chunk_id", nativeQuery = true)
    List<Embedding> findByDocumentIdOrdered(@Param("documentId") String documentId);
    
    /**
     * 벡터 유사도 검색 (pgvector 사용)
     * @param queryVector 검색할 벡터
     * @param limit 결과 개수 제한
     * @return 유사도 점수와 문서 정보
     */
    @Query(value = "SELECT " +
        "e.document_name, " +
        "e.chunk_id, " +
        "e.chunk_text, " +
        "(e.embedding <-> CAST(:queryVector AS vector)) AS similarity " +
        "FROM embeddings e " +
        "ORDER BY e.embedding <-> CAST(:queryVector AS vector) " +
        "LIMIT :limit", nativeQuery = true)
    List<Object[]> findSimilarEmbeddings(@Param("queryVector") String queryVector, @Param("limit") int limit);
    
    /**
     * 벡터 유사도 검색 (List<Double> 벡터 사용)
     */
    default List<java.util.Map<String, Object>> findSimilarEmbeddings(List<Double> queryVector, int limit) {
        // 벡터를 PostgreSQL 배열 형식으로 변환
        String vectorString = "[" + queryVector.stream()
                .map(String::valueOf)
                .collect(java.util.stream.Collectors.joining(",")) + "]";
        
        List<Object[]> results = findSimilarEmbeddings(vectorString, limit);
        
        return results.stream()
                .map(row -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("document_name", row[0]);
                    map.put("chunk_id", row[1]);
                    map.put("chunk_text", row[2]);
                    map.put("similarity", row[3]);
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
