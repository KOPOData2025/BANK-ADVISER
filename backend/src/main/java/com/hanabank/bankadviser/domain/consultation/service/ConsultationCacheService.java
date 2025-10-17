package com.hanabank.bankadviser.domain.consultation.service;

import com.hanabank.bankadviser.domain.consultation.entity.ConsultationSession;
import com.hanabank.bankadviser.domain.consultation.repository.ConsultationSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 상담 데이터 캐싱 서비스
 * 성능 최적화: 상담 조회 결과 캐싱, 페이지네이션, 비동기 로딩
 */
@Service
@Slf4j
public class ConsultationCacheService {

    @Autowired
    private ConsultationSessionRepository consultationSessionRepository;
    
    // 메모리 캐시 (Redis 대신 사용)
    private final Map<String, Object> memoryCache = new ConcurrentHashMap<>();
    private final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
    
        // 캐시 TTL (5분)
        private static final long CACHE_TTL = 5 * 60 * 1000L;

    /**
     * 고객별 상담 세션 캐싱 조회
     */
    @Cacheable(value = "consultationSessions", key = "#customerId")
    public List<ConsultationSession> getCachedSessions(String customerId) {
        log.info("🔍 상담 세션 조회 (캐시 미스): customerId={}", customerId);
        
        List<ConsultationSession> sessions = consultationSessionRepository
            .findByCustomerIdOrderByCreatedAtDesc(customerId);
        
        log.info("✅ 상담 세션 조회 완료: customerId={}, count={}", customerId, sessions.size());
        return sessions;
    }

    /**
     * 페이지네이션된 상담 세션 조회
     */
    public Page<ConsultationSession> getSessionsWithPagination(
            String customerId, 
            int page, 
            int size) {
        
        String cacheKey = String.format("sessions_page_%s_%d_%d", customerId, page, size);
        
            // 메모리 캐시 확인
            if (isCacheValid(cacheKey)) {
                log.info("✅ 페이지네이션 캐시 히트: {}", cacheKey);
                Object cached = memoryCache.get(cacheKey);
                if (cached instanceof Page) {
                    return (Page<ConsultationSession>) cached;
                }
            }
        
        log.info("🔍 페이지네이션 조회 (캐시 미스): customerId={}, page={}, size={}", 
                customerId, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ConsultationSession> sessions = consultationSessionRepository
            .findByCustomerId(customerId, pageable);
        
        // 메모리 캐시에 저장
        memoryCache.put(cacheKey, sessions);
        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
        
        log.info("✅ 페이지네이션 조회 완료: customerId={}, totalElements={}", 
                customerId, sessions.getTotalElements());
        
        return sessions;
    }

    /**
     * 최근 상담 세션 조회 (캐싱)
     */
    public List<ConsultationSession> getRecentSessions(String customerId, int limit) {
        String cacheKey = String.format("recent_sessions_%s_%d", customerId, limit);
        
            if (isCacheValid(cacheKey)) {
                log.info("✅ 최근 상담 캐시 히트: {}", cacheKey);
                Object cached = memoryCache.get(cacheKey);
                if (cached instanceof List) {
                    return (List<ConsultationSession>) cached;
                }
            }
        
        log.info("🔍 최근 상담 조회 (캐시 미스): customerId={}, limit={}", customerId, limit);
        
        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        Page<ConsultationSession> sessions = consultationSessionRepository
            .findByCustomerId(customerId, pageable);
        
        List<ConsultationSession> result = sessions.getContent();
        
        // 메모리 캐시에 저장
        memoryCache.put(cacheKey, result);
        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
        
        log.info("✅ 최근 상담 조회 완료: customerId={}, count={}", customerId, result.size());
        
        return result;
    }

    /**
     * 상담 세션 상세 조회 (캐싱)
     */
    public ConsultationSession getSessionById(String sessionId) {
        String cacheKey = String.format("session_detail_%s", sessionId);
        
        if (isCacheValid(cacheKey)) {
            log.info("✅ 상담 상세 캐시 히트: {}", cacheKey);
            return (ConsultationSession) memoryCache.get(cacheKey);
        }
        
        log.info("🔍 상담 상세 조회 (캐시 미스): sessionId={}", sessionId);
        
        ConsultationSession session = consultationSessionRepository
            .findBySessionId(sessionId)
            .orElse(null);
        
        if (session != null) {
            // 메모리 캐시에 저장
            memoryCache.put(cacheKey, session);
            cacheTimestamps.put(cacheKey, System.currentTimeMillis());
            
            log.info("✅ 상담 상세 조회 완료: sessionId={}", sessionId);
        }
        
        return session;
    }

    /**
     * 비동기 상담 데이터 로딩
     */
    @Async
    public CompletableFuture<List<ConsultationSession>> loadConsultationDataAsync(String customerId) {
        log.info("🔄 비동기 상담 데이터 로딩 시작: customerId={}", customerId);
        
        try {
            List<ConsultationSession> sessions = getCachedSessions(customerId);
            log.info("✅ 비동기 상담 데이터 로딩 완료: customerId={}, count={}", 
                    customerId, sessions.size());
            return CompletableFuture.completedFuture(sessions);
        } catch (Exception e) {
            log.error("❌ 비동기 상담 데이터 로딩 실패: customerId={}", customerId, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * 상담 통계 조회 (캐싱)
     */
    public Map<String, Object> getConsultationStats(String customerId) {
        String cacheKey = String.format("consultation_stats_%s", customerId);
        
        if (isCacheValid(cacheKey)) {
            log.info("✅ 상담 통계 캐시 히트: {}", cacheKey);
            return (Map<String, Object>) memoryCache.get(cacheKey);
        }
        
        log.info("🔍 상담 통계 조회 (캐시 미스): customerId={}", customerId);
        
        List<ConsultationSession> sessions = getCachedSessions(customerId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", sessions.size());
        stats.put("completedSessions", sessions.stream()
            .mapToInt(s -> "completed".equals(s.getStatus()) ? 1 : 0)
            .sum());
        stats.put("averageDuration", sessions.stream()
            .filter(s -> s.getDuration() != null)
            .mapToLong(ConsultationSession::getDuration)
            .average()
            .orElse(0.0));
        stats.put("lastConsultationDate", sessions.isEmpty() ? null : 
            sessions.get(0).getCreatedAt());
        
        // 메모리 캐시에 저장
        memoryCache.put(cacheKey, stats);
        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
        
        log.info("✅ 상담 통계 조회 완료: customerId={}, stats={}", customerId, stats);
        
        return stats;
    }

    /**
     * 캐시 무효화
     */
    @CacheEvict(value = "consultationSessions", key = "#customerId")
    public void evictCache(String customerId) {
        log.info("🗑️ 상담 캐시 무효화: customerId={}", customerId);
        
        // 메모리 캐시에서 관련 키들 제거
        memoryCache.entrySet().removeIf(entry -> 
            entry.getKey().contains(customerId));
        cacheTimestamps.entrySet().removeIf(entry -> 
            entry.getKey().contains(customerId));
    }

    /**
     * 전체 캐시 클리어
     */
    public void clearAllCache() {
        log.info("🗑️ 전체 상담 캐시 클리어");
        memoryCache.clear();
        cacheTimestamps.clear();
    }

    /**
     * 캐시 유효성 검사
     */
    private boolean isCacheValid(String cacheKey) {
        Long timestamp = cacheTimestamps.get(cacheKey);
        if (timestamp == null) return false;
        
        boolean isValid = (System.currentTimeMillis() - timestamp) < CACHE_TTL;
        if (!isValid) {
            // 만료된 캐시 제거
            memoryCache.remove(cacheKey);
            cacheTimestamps.remove(cacheKey);
        }
        
        return isValid;
    }

    /**
     * 캐시 통계
     */
    public Map<String, Object> getCacheStats() {
        long validEntries = cacheTimestamps.values().stream()
            .mapToLong(timestamp -> 
                (System.currentTimeMillis() - timestamp) < CACHE_TTL ? 1 : 0)
            .sum();
        
        return Map.of(
            "totalEntries", memoryCache.size(),
            "validEntries", validEntries,
            "expiredEntries", memoryCache.size() - validEntries,
            "cacheHitRate", calculateCacheHitRate(),
            "memoryUsage", estimateMemoryUsage()
        );
    }

    /**
     * 캐시 히트율 계산 (간단한 구현)
     */
    private double calculateCacheHitRate() {
        // 실제 구현에서는 히트/미스 카운터를 추가해야 함
        return 0.75; // 예시 값
    }

    /**
     * 메모리 사용량 추정
     */
    private long estimateMemoryUsage() {
        return memoryCache.values().stream()
            .mapToLong(obj -> obj.toString().length() * 2) // 대략적인 바이트 수
            .sum();
    }

    /**
     * 캐시 정리 (만료된 항목 제거)
     */
    public void cleanupExpiredCache() {
        log.info("🧹 만료된 캐시 정리 시작");
        
        long currentTime = System.currentTimeMillis();
        final int[] removedCount = {0};
        
        cacheTimestamps.entrySet().removeIf(entry -> {
            boolean expired = (currentTime - entry.getValue()) >= CACHE_TTL;
            if (expired) {
                memoryCache.remove(entry.getKey());
                removedCount[0]++;
            }
            return expired;
        });
        
        log.info("✅ 만료된 캐시 정리 완료: {}개 항목 제거", removedCount[0]);
    }
}
