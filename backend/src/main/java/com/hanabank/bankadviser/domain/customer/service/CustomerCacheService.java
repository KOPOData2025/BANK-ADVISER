package com.hanabank.bankadviser.domain.customer.service;

import com.hanabank.bankadviser.domain.customer.entity.Customer;
import com.hanabank.bankadviser.domain.customer.entity.CustomerProduct;
import com.hanabank.bankadviser.domain.customer.repository.CustomerRepository;
import com.hanabank.bankadviser.domain.customer.repository.CustomerProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * 고객 데이터 Redis 캐시 서비스
 * 고객 로딩 시 Redis 캐시를 우선 사용하여 성능 최적화
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerCacheService {

    private final CustomerRepository customerRepository;
    private final CustomerProductRepository customerProductRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CUSTOMER_CACHE_PREFIX = "customer:";
    private static final String CUSTOMER_PRODUCTS_CACHE_PREFIX = "customer:products:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30); // 30분 캐시

    /**
     * 고객 정보 조회
     */
    @Cacheable(value = "customers", key = "#customerId")
    public Optional<Customer> getCustomerById(String customerId) {
        log.info("🔍 고객 정보 조회 (DB): {}", customerId);
        
        try {
            Optional<Customer> customer = customerRepository.findById(customerId);
            if (customer.isPresent()) {
                log.info("✅ 고객 정보 조회 성공: {} - {}", customerId, customer.get().getName());
            } else {
                log.warn("⚠️ 고객 정보 없음: {}", customerId);
            }
            return customer;
        } catch (Exception e) {
            log.error("❌ 고객 정보 조회 실패: {}", customerId, e);
            return Optional.empty();
        }
    }

    /**
     * 고객 상품 정보 조회
     */
    public List<CustomerProduct> getCustomerProducts(String customerId) {
        log.info("🔍 고객 상품 정보 조회 (DB): {}", customerId);
        
        try {
            List<CustomerProduct> products = customerProductRepository.findByCustomerCustomerId(customerId);
            log.info("✅ 고객 상품 정보 조회 성공: {} - {}개 상품", customerId, products.size());
            return products;
        } catch (Exception e) {
            log.error("❌ 고객 상품 정보 조회 실패: {}", customerId, e);
            return List.of();
        }
    }

    /**
     * 고객 정보 캐시 무효화
     */
    @CacheEvict(value = "customers", key = "#customerId")
    public void evictCustomerCache(String customerId) {
        log.info("🗑️ 고객 정보 캐시 무효화: {}", customerId);
    }

    /**
     * 고객 상품 정보 캐시 무효화
     */
    @CacheEvict(value = "customerProducts", key = "#customerId")
    public void evictCustomerProductsCache(String customerId) {
        log.info("🗑️ 고객 상품 정보 캐시 무효화: {}", customerId);
    }

    /**
     * 모든 고객 관련 캐시 무효화
     */
    @CacheEvict(value = {"customers", "customerProducts"}, allEntries = true)
    public void evictAllCustomerCache() {
        log.info("🗑️ 모든 고객 관련 캐시 무효화");
    }

    /**
     * Redis에 직접 캐시 저장
     */
    public void cacheCustomerData(String customerId, Customer customer) {
        try {
            String cacheKey = CUSTOMER_CACHE_PREFIX + customerId;
            redisTemplate.opsForValue().set(cacheKey, customer, CACHE_TTL);
            log.info("💾 고객 정보 Redis 캐시 저장: {}", customerId);
        } catch (Exception e) {
            log.error("❌ Redis 캐시 저장 실패: {}", customerId, e);
        }
    }

    /**
     * Redis에서 직접 캐시 조회
     */
    public Optional<Customer> getCachedCustomer(String customerId) {
        try {
            String cacheKey = CUSTOMER_CACHE_PREFIX + customerId;
            Customer customer = (Customer) redisTemplate.opsForValue().get(cacheKey);
            if (customer != null) {
                log.info("📦 고객 정보 Redis 캐시 히트: {}", customerId);
                return Optional.of(customer);
            }
        } catch (Exception e) {
            log.error("❌ Redis 캐시 조회 실패: {}", customerId, e);
        }
        return Optional.empty();
    }

    /**
     * Redis에 고객 상품 정보 캐시 저장
     */
    public void cacheCustomerProducts(String customerId, List<CustomerProduct> products) {
        try {
            String cacheKey = CUSTOMER_PRODUCTS_CACHE_PREFIX + customerId;
            redisTemplate.opsForValue().set(cacheKey, products, CACHE_TTL);
            log.info("💾 고객 상품 정보 Redis 캐시 저장: {} - {}개 상품", customerId, products.size());
        } catch (Exception e) {
            log.error("❌ Redis 캐시 저장 실패: {}", customerId, e);
        }
    }

    /**
     * Redis에서 고객 상품 정보 캐시 조회
     */
    @SuppressWarnings("unchecked")
    public Optional<List<CustomerProduct>> getCachedCustomerProducts(String customerId) {
        try {
            String cacheKey = CUSTOMER_PRODUCTS_CACHE_PREFIX + customerId;
            List<CustomerProduct> products = (List<CustomerProduct>) redisTemplate.opsForValue().get(cacheKey);
            if (products != null) {
                log.info("📦 고객 상품 정보 Redis 캐시 히트: {} - {}개 상품", customerId, products.size());
                return Optional.of(products);
            }
        } catch (Exception e) {
            log.error("❌ Redis 캐시 조회 실패: {}", customerId, e);
        }
        return Optional.empty();
    }

    /**
     * 캐시 통계 조회
     */
    public void printCacheStats() {
        try {
            // Redis 키 개수 조회
            int customerKeys = redisTemplate.keys(CUSTOMER_CACHE_PREFIX + "*").size();
            int productKeys = redisTemplate.keys(CUSTOMER_PRODUCTS_CACHE_PREFIX + "*").size();
            
            log.info("📊 Redis 캐시 통계:");
            log.info("  - 고객 정보 캐시: {}개", customerKeys);
            log.info("  - 고객 상품 캐시: {}개", productKeys);
            log.info("  - 총 캐시 키: {}개", customerKeys + productKeys);
        } catch (Exception e) {
            log.error("❌ 캐시 통계 조회 실패", e);
        }
    }
}
