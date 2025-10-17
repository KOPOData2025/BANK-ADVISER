package com.hanabank.bankadviser.domain.product.service;

import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import com.hanabank.bankadviser.domain.product.entity.ProductRate;
import com.hanabank.bankadviser.domain.product.entity.LoanRate;
import com.hanabank.bankadviser.domain.product.repository.FinancialProductRepository;
import com.hanabank.bankadviser.domain.product.repository.ProductRateRepository;
import com.hanabank.bankadviser.domain.product.repository.LoanRateRepository;
import com.hanabank.bankadviser.domain.product.repository.ProductFormRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    
    private final FinancialProductRepository financialProductRepository;
    private final ProductRateRepository productRateRepository;
    private final LoanRateRepository loanRateRepository;
    private final ProductFormRepository productFormRepository;
    private final JdbcTemplate jdbcTemplate;
    
    public Page<FinancialProduct> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return financialProductRepository.findAll(pageable);
    }
    
    public List<FinancialProduct> getAllProducts() {
        return financialProductRepository.findAll();
    }
    
    public Optional<FinancialProduct> getProductById(String productId) {
        try {
            String sql = "SELECT * FROM product WHERE productid = ?";
            List<FinancialProduct> products = jdbcTemplate.query(sql, new RowMapper<FinancialProduct>() {
                @Override
                public FinancialProduct mapRow(ResultSet rs, int rowNum) throws SQLException {
                    FinancialProduct product = new FinancialProduct();
                    product.setProductId(rs.getString("productid"));
                    product.setProductName(rs.getString("productname"));
                    product.setProductType(rs.getString("producttype"));
                    product.setBaseRate(rs.getBigDecimal("baserate"));
                    product.setMinAmount(rs.getBigDecimal("minamount"));
                    product.setMaxAmount(rs.getBigDecimal("maxamount"));
                    product.setDescription(rs.getString("description"));
                    product.setLaunchDate(rs.getDate("launchdate") != null ? rs.getDate("launchdate").toLocalDate() : null);
                    product.setSalesStatus(rs.getString("salesstatus"));
                    return product;
                }
            }, productId);
            
            return products.isEmpty() ? Optional.empty() : Optional.of(products.get(0));
        } catch (Exception e) {
            log.error("상품 조회 중 오류 발생: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    public List<FinancialProduct> getProductsByType(String productType) {
        return financialProductRepository.findByProductType(productType);
    }
    
    public Page<FinancialProduct> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return financialProductRepository.findByKeyword(keyword, pageable);
    }
    
    public List<String> getAllProductTypes() {
        return financialProductRepository.findAllProductTypes();
    }
    
    public FinancialProduct saveProduct(FinancialProduct product) {
        return financialProductRepository.save(product);
    }
    
    public void deleteProduct(String productId) {
        financialProductRepository.deleteById(productId);
    }
    
    /**
     * product_details 테이블에서 모든 상품 정보 조회 (우대금리 포함)
     */
    public List<Map<String, Object>> getProductDetails() {
        try {
            String sql = "SELECT * FROM product_details ORDER BY product_name";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("product_details 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * product_details 테이블에서 모든 우대금리 조건 추출
     */
    public List<Map<String, Object>> getPreferentialConditions() {
        try {
            String sql = "SELECT DISTINCT " +
                "jsonb_array_elements(preferential_rates)->>'item' as condition_name, " +
                "jsonb_array_elements(preferential_rates)->>'description' as description, " +
                "(jsonb_array_elements(preferential_rates)->>'rate_value')::numeric as rate_value, " +
                "jsonb_array_elements(preferential_rates)->>'rate' as rate_display " +
                "FROM product_details " +
                "WHERE preferential_rates IS NOT NULL " +
                "ORDER BY condition_name";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("우대금리 조건 추출 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    // ProductRate 관련 메서드
    public List<ProductRate> getProductRates(String productId) {
        return productRateRepository.findByProductId(productId);
    }
    
    public List<ProductRate> getProductRatesByPeriod(String productId, String period) {
        return productRateRepository.findByProductIdAndPeriod(productId, period);
    }
    
    // LoanRate 관련 메서드
    public List<LoanRate> getLoanRates(String productId) {
        return loanRateRepository.findByProductId(productId);
    }
    
    public List<LoanRate> getLoanRatesByType(String productId, String rateType) {
        return loanRateRepository.findByProductIdAndRateType(productId, rateType);
    }

    /**
     * 상품 가입 시 필요한 EForm 목록 조회 (DB 기반)
     * 1. 상품 타입별 공통 서식
     * 2. 상품별 특정 서식
     */
    /**
     * 상품별 설명서 정보 조회
     */
    public Map<String, Object> getProductDocumentInfo(String productId) {
        try {
            Optional<FinancialProduct> productOpt = getProductById(productId);
            if (productOpt.isPresent()) {
                FinancialProduct product = productOpt.get();
                Map<String, Object> documentInfo = new HashMap<>();
                documentInfo.put("productId", product.getProductId());
                documentInfo.put("productName", product.getProductName());
                documentInfo.put("documentPath", product.getDocumentPath());
                documentInfo.put("documentName", product.getDocumentName());
                documentInfo.put("hasDocument", product.getDocumentPath() != null && !product.getDocumentPath().isEmpty());
                return documentInfo;
            }
            return new HashMap<>();
        } catch (Exception e) {
            log.error("상품 설명서 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * 상품 설명서 매핑 업데이트
     */
    public FinancialProduct updateProductDocument(String productId, String documentPath, String documentName) {
        try {
            Optional<FinancialProduct> productOpt = getProductById(productId);
            if (productOpt.isPresent()) {
                FinancialProduct product = productOpt.get();
                product.setDocumentPath(documentPath);
                product.setDocumentName(documentName);
                return saveProduct(product);
            }
            return null;
        } catch (Exception e) {
            log.error("상품 설명서 업데이트 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }

    public List<Map<String, Object>> getProductForms(String productId, String productType) {
        // 결과를 formId 기준으로 중복 제거하며 보존
        Map<String, Map<String, Object>> formIdToMap = new HashMap<>();

        // 1) 타입별 공통 서식
        try {
            productFormRepository.findByProductType(productType).forEach(form -> {
                Map<String, Object> formMap = new HashMap<>();
                formMap.put("formId", form.getFormId());
                formMap.put("formName", form.getFormName());
                formMap.put("formType", form.getFormType());
                formMap.put("formTemplatePath", form.getFormTemplatePath());
                formMap.put("formSchema", form.getFormSchema());
                formMap.put("description", form.getDescription());
                formMap.put("versionNumber", form.getVersionNumber());
                formMap.put("isCommon", true);
                formIdToMap.put(form.getFormId(), formMap);
            });
        } catch (Exception e) {
            log.warn("공통 서식 조회 중 오류: {}", e.getMessage());
        }

        // 2) 상품별 특정 서식
        try {
            productFormRepository.findByProductId(productId).forEach(form -> {
                Map<String, Object> formMap = new HashMap<>();
                formMap.put("formId", form.getFormId());
                formMap.put("formName", form.getFormName());
                formMap.put("formType", form.getFormType());
                formMap.put("formTemplatePath", form.getFormTemplatePath());
                formMap.put("formSchema", form.getFormSchema());
                formMap.put("description", form.getDescription());
                formMap.put("versionNumber", form.getVersionNumber());
                formMap.put("isCommon", false);
                formIdToMap.put(form.getFormId(), formMap);
            });
        } catch (Exception e) {
            log.warn("상품별 서식 조회 중 오류: {}", e.getMessage());
        }

        return new ArrayList<>(formIdToMap.values());
    }

    /**
     * 적금 상품 우대금리 비교 조회
     */
    public List<Map<String, Object>> getSavingsComparison() {
        try {
            String sql = "SELECT " +
                "ROW_NUMBER() OVER (ORDER BY " +
                "CASE " +
                "WHEN basic_rates->>'description' LIKE '%연 5.00%' THEN 5.0 " +
                "WHEN basic_rates->>'description' LIKE '%연 4.50%' THEN 4.5 " +
                "WHEN basic_rates->>'description' LIKE '%연 3.00%' THEN 3.0 " +
                "WHEN basic_rates->>'description' LIKE '%연 2.75%' THEN 2.75 " +
                "WHEN basic_rates->>'description' LIKE '%연 2.85%' THEN 2.85 " +
                "WHEN basic_rates->>'description' LIKE '%연 2.30%' THEN 2.3 " +
                "WHEN basic_rates->>'description' LIKE '%연 2.00%' THEN 2.0 " +
                "WHEN basic_rates->>'description' LIKE '%연 1.80%' THEN 1.8 " +
                "ELSE 0 " +
                "END DESC, " +
                "(product_info->>'preferential_rates_count')::int DESC " +
                ") as 순위, " +
                "product_name as 상품명, " +
                "category as 카테고리, " +
                "basic_rates->>'description' as 기본금리, " +
                "basic_rates->>'max_rate' as 최고금리, " +
                "(product_info->>'preferential_rates_count')::int as 우대금리_개수, " +
                "CASE " +
                "WHEN (product_info->>'preferential_rates_count')::int > 0 THEN '우대조건 ' || (product_info->>'preferential_rates_count')::int || '개' " +
                "ELSE '우대조건 없음' " +
                "END as 우대조건_요약 " +
                "FROM product_details " +
                "WHERE category = '적금' " +
                "ORDER BY 순위 " +
                "LIMIT 20";
            
            return jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> result = new HashMap<>();
                    result.put("순위", rs.getInt("순위"));
                    result.put("상품명", rs.getString("상품명"));
                    result.put("카테고리", rs.getString("카테고리"));
                    result.put("기본금리", rs.getString("기본금리"));
                    result.put("최고금리", rs.getString("최고금리"));
                    result.put("우대금리_개수", rs.getInt("우대금리_개수"));
                    result.put("우대조건_요약", rs.getString("우대조건_요약"));
                    return result;
                }
            });
        } catch (Exception e) {
            log.error("적금 상품 비교 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * 특정 상품의 우대금리 상세 정보 조회
     */
    public Map<String, Object> getPreferentialDetails(String productName) {
        try {
            String sql = "SELECT " +
                "product_name as 상품명, " +
                "basic_rates->>'description' as 기본금리, " +
                "basic_rates->>'max_rate' as 최고금리, " +
                "jsonb_array_length(preferential_rates) as 우대금리_개수, " +
                "preferential_rates as 우대금리_상세 " +
                "FROM product_details " +
                "WHERE product_name = ?";
            
            List<Map<String, Object>> results = jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> result = new HashMap<>();
                    result.put("상품명", rs.getString("상품명"));
                    result.put("기본금리", rs.getString("기본금리"));
                    result.put("최고금리", rs.getString("최고금리"));
                    result.put("우대금리_개수", rs.getInt("우대금리_개수"));
                    result.put("우대금리_상세", rs.getString("우대금리_상세"));
                    return result;
                }
            }, productName);
            
            return results.isEmpty() ? null : results.get(0);
        } catch (Exception e) {
            log.error("우대금리 상세 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 통합 금융상품 비교 (적금 + 예금)
     */
    public List<Map<String, Object>> getAllProductsComparison() {
        try {
            String sql = "SELECT * FROM v_금융상품_통합비교 " +
                "ORDER BY 상품분류, 우대금리_개수 DESC " +
                "LIMIT 30";
            
            return jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> result = new HashMap<>();
                    result.put("상품명", rs.getString("상품명"));
                    result.put("상품유형", rs.getString("상품유형"));
                    result.put("상품분류", rs.getString("상품분류"));
                    result.put("기본금리", rs.getString("기본금리"));
                    result.put("최고금리", rs.getString("최고금리"));
                    result.put("우대금리_개수", rs.getInt("우대금리_개수"));
                    result.put("상품URL", rs.getString("상품URL"));
                    return result;
                }
            });
        } catch (Exception e) {
            log.error("통합 상품 비교 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * 상품명으로 product_details 테이블에서 상세 정보 조회
     * 정확한 매칭이 안 되면 유사한 상품명으로 검색
     */
    public Map<String, Object> getProductDetailsByName(String productName) {
        try {
            // 상품명 매핑 적용
            String mappedProductName = mapProductName(productName);
            log.info("상품 상세 정보 조회 요청: {} -> {}", productName, mappedProductName);
            
            // 1. 정확한 매칭 시도
            String exactSql = "SELECT " +
                "product_name, " +
                "product_url, " +
                "category, " +
                "basic_rates, " +
                "applied_rates, " +
                "preferential_rates, " +
                "product_info, " +
                "crawled_at " +
                "FROM product_details " +
                "WHERE product_name = ?";
            
            List<Map<String, Object>> exactResults = jdbcTemplate.query(exactSql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> result = new HashMap<>();
                    result.put("productName", rs.getString("product_name"));
                    result.put("productUrl", rs.getString("product_url"));
                    result.put("category", rs.getString("category"));
                    result.put("basicRates", rs.getString("basic_rates"));
                    result.put("appliedRates", rs.getString("applied_rates"));
                    result.put("preferentialRates", rs.getString("preferential_rates"));
                    result.put("productInfo", rs.getString("product_info"));
                    result.put("crawledAt", rs.getTimestamp("crawled_at"));
                    return result;
                }
            }, mappedProductName);
            
            if (!exactResults.isEmpty()) {
                log.info("정확한 상품명 매칭 성공: {}", mappedProductName);
                return exactResults.get(0);
            }
            
            // 2. 유사한 상품명으로 검색 (LIKE 사용)
            String likeSql = "SELECT " +
                "product_name, " +
                "product_url, " +
                "category, " +
                "basic_rates, " +
                "applied_rates, " +
                "preferential_rates, " +
                "product_info, " +
                "crawled_at " +
                "FROM product_details " +
                "WHERE product_name LIKE ? OR product_name LIKE ? " +
                "LIMIT 1";
            
            // 상품명에서 키워드 추출하여 검색
            String keyword1 = "%" + mappedProductName + "%";
            String keyword2 = "%" + extractKeywords(mappedProductName) + "%";
            
            List<Map<String, Object>> likeResults = jdbcTemplate.query(likeSql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> result = new HashMap<>();
                    result.put("productName", rs.getString("product_name"));
                    result.put("productUrl", rs.getString("product_url"));
                    result.put("category", rs.getString("category"));
                    result.put("basicRates", rs.getString("basic_rates"));
                    result.put("appliedRates", rs.getString("applied_rates"));
                    result.put("preferentialRates", rs.getString("preferential_rates"));
                    result.put("productInfo", rs.getString("product_info"));
                    result.put("crawledAt", rs.getTimestamp("crawled_at"));
                    return result;
                }
            }, keyword1, keyword2);
            
            if (!likeResults.isEmpty()) {
                log.info("유사한 상품명 매칭 성공: {} -> {}", mappedProductName, likeResults.get(0).get("productName"));
                return likeResults.get(0);
            }
            
            log.info("상품 상세 정보 없음: {} (매핑된 이름: {})", productName, mappedProductName);
            return null;
        } catch (Exception e) {
            log.error("상품 상세 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 상품명에서 키워드 추출 (적금, 예금, 통장 등)
     */
    private String extractKeywords(String productName) {
        if (productName.contains("적금")) return "적금";
        if (productName.contains("예금")) return "예금";
        if (productName.contains("통장")) return "통장";
        if (productName.contains("급여")) return "급여";
        if (productName.contains("하나")) return "하나";
        return productName;
    }
    
    /**
     * 상품명 매핑 (프론트엔드 상품명 -> product_details 상품명)
     */
    private String mapProductName(String frontendProductName) {
        // 상품명 매핑 테이블 (실제 product_details 테이블의 상품명 기반)
        Map<String, String> productMapping = new HashMap<>();
        
        // 적금 상품 매핑
        productMapping.put("급여하나 월복리 적금", "급여하나 월복리 적금");
        productMapping.put("(내맘) 적금", "내맘 적금");
        productMapping.put("달달 하나 적금", "달달 하나 적금");
        productMapping.put("하나 청년도약계좌", "하나 청년도약계좌");
        productMapping.put("하나더이지 적금", "하나더이지 적금");
        productMapping.put("대한민국만세_80주년 적금", "대한민국만세_80주년 적금");
        productMapping.put("하나 아이키움 적금", "하나 아이키움 적금");
        productMapping.put("하나더소호 가맹점 적금", "하나더소호 가맹점 적금");
        productMapping.put("하나 중소기업재직자 우대저축", "하나 중소기업재직자 우대저축");
        productMapping.put("(K리그) 우승 적금", "(K리그) 우승 적금");
        
        // 예금 상품 매핑
        productMapping.put("하나의 정기예금", "하나의 정기예금");
        productMapping.put("369 정기예금", "369 정기예금");
        productMapping.put("3·6·9 정기예금", "369 정기예금");
        
        // 매핑된 상품명이 있으면 반환
        String mappedName = productMapping.get(frontendProductName);
        if (mappedName != null) {
            log.info("상품명 매핑: {} -> {}", frontendProductName, mappedName);
            return mappedName;
        }
        
        return frontendProductName;
    }

    /**
     * Supabase에서 모든 상품 데이터 조회 (279개 상품)
     */
    public List<Map<String, Object>> getAllProductsFromSupabase() {
        try {
            String sql = "SELECT * FROM product ORDER BY productname";
            return jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", rs.getString("productid"));
                    product.put("productName", rs.getString("productname"));
                    product.put("productType", rs.getString("producttype"));
                    product.put("description", rs.getString("description"));
                    product.put("launchDate", rs.getDate("launchdate"));
                    product.put("salesStatus", rs.getString("salesstatus"));
                    product.put("minAmount", rs.getBigDecimal("minamount"));
                    product.put("maxAmount", rs.getBigDecimal("maxamount"));
                    product.put("baseRate", rs.getBigDecimal("baserate"));
                    product.put("documentName", rs.getString("document_name"));
                    product.put("documentPath", rs.getString("document_path"));
                    return product;
                }
            });
        } catch (Exception e) {
            log.error("Supabase에서 모든 상품 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Supabase에서 상품 타입별 조회
     */
    public List<Map<String, Object>> getProductsByTypeFromSupabase(String productType) {
        try {
            String sql = "SELECT * FROM product WHERE producttype = ? ORDER BY productname";
            return jdbcTemplate.query(sql, new Object[]{productType}, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", rs.getString("productid"));
                    product.put("productName", rs.getString("productname"));
                    product.put("productType", rs.getString("producttype"));
                    product.put("description", rs.getString("description"));
                    product.put("launchDate", rs.getDate("launchdate"));
                    product.put("salesStatus", rs.getString("salesstatus"));
                    product.put("minAmount", rs.getBigDecimal("minamount"));
                    product.put("maxAmount", rs.getBigDecimal("maxamount"));
                    product.put("baseRate", rs.getBigDecimal("baserate"));
                    product.put("documentName", rs.getString("document_name"));
                    product.put("documentPath", rs.getString("document_path"));
                    return product;
                }
            });
        } catch (Exception e) {
            log.error("Supabase에서 상품 타입별 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Supabase에서 판매중인 상품만 조회
     */
    public List<Map<String, Object>> getActiveProductsFromSupabase() {
        try {
            String sql = "SELECT * FROM product WHERE salesstatus = '판매중' ORDER BY productname";
            return jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", rs.getString("productid"));
                    product.put("productName", rs.getString("productname"));
                    product.put("productType", rs.getString("producttype"));
                    product.put("description", rs.getString("description"));
                    product.put("launchDate", rs.getDate("launchdate"));
                    product.put("salesStatus", rs.getString("salesstatus"));
                    product.put("minAmount", rs.getBigDecimal("minamount"));
                    product.put("maxAmount", rs.getBigDecimal("maxamount"));
                    product.put("baseRate", rs.getBigDecimal("baserate"));
                    product.put("documentName", rs.getString("document_name"));
                    product.put("documentPath", rs.getString("document_path"));
                    return product;
                }
            });
        } catch (Exception e) {
            log.error("Supabase에서 판매중 상품 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public List<Map<String, Object>> getProductsWithBenefitsFromSupabase() {
        try {
            String sql = "SELECT " +
                "p.*, " +
                "COALESCE( " +
                "JSON_AGG( " +
                "JSON_BUILD_OBJECT( " +
                "'benefitId', b.benefitid, " +
                "'benefitName', b.benefitname, " +
                "'benefitType', b.benefittype, " +
                "'defaultValue', b.defaultvalue, " +
                "'description', b.description, " +
                "'applicableValue', pb.applicablevalue, " +
                "'calculationMethod', pb.applicablecalculationmethod " +
                ") " +
                ") FILTER (WHERE b.benefitid IS NOT NULL), " +
                "'[]'::json " +
                ") as benefits " +
                "FROM product p " +
                "LEFT JOIN productbenefit pb ON p.productid = pb.productid " +
                "LEFT JOIN benefit b ON pb.benefitid = b.benefitid " +
                "WHERE p.salesstatus = '판매중' " +
                "GROUP BY p.productid, p.productname, p.producttype, p.description, " +
                "p.launchdate, p.salesstatus, p.minamount, p.maxamount, " +
                "p.baserate, p.document_name, p.document_path " +
                "ORDER BY p.productname";
            
            return jdbcTemplate.query(sql, new RowMapper<Map<String, Object>>() {
                @Override
                public Map<String, Object> mapRow(ResultSet rs, int rowNum) throws SQLException {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", rs.getString("productid"));
                    product.put("productName", rs.getString("productname"));
                    product.put("productType", rs.getString("producttype"));
                    product.put("description", rs.getString("description"));
                    product.put("launchDate", rs.getDate("launchdate"));
                    product.put("salesStatus", rs.getString("salesstatus"));
                    product.put("minAmount", rs.getBigDecimal("minamount"));
                    product.put("maxAmount", rs.getBigDecimal("maxamount"));
                    product.put("baseRate", rs.getBigDecimal("baserate"));
                    product.put("documentName", rs.getString("document_name"));
                    product.put("documentPath", rs.getString("document_path"));
                    
                    // 우대금리 정보 추가
                    String benefitsJson = rs.getString("benefits");
                    if (benefitsJson != null && !benefitsJson.equals("[]")) {
                        try {
                            ObjectMapper mapper = new ObjectMapper();
                            List<Map<String, Object>> benefits = mapper.readValue(benefitsJson, List.class);
                            product.put("benefits", benefits);
                        } catch (Exception e) {
                            log.warn("우대금리 JSON 파싱 실패: {}", benefitsJson);
                            product.put("benefits", new ArrayList<>());
                        }
                    } else {
                        product.put("benefits", new ArrayList<>());
                    }
                    
                    return product;
                }
            });
        } catch (Exception e) {
            log.error("Supabase에서 상품 및 우대금리 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}


