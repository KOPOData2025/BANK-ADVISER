package com.hanabank.bankadviser.domain.product.controller;

import com.hanabank.bankadviser.global.shared.dto.ApiResponse;
import com.hanabank.bankadviser.domain.product.entity.FinancialProduct;
import com.hanabank.bankadviser.domain.product.entity.ProductRate;
import com.hanabank.bankadviser.domain.product.entity.LoanRate;
import com.hanabank.bankadviser.domain.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/employee/products")
@CrossOrigin(origins = "*", allowCredentials = "false")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * 상품 API 테스트 엔드포인트
     */
    @GetMapping("/api-test")
    public ResponseEntity<ApiResponse<String>> testEndpoint() {
        log.info("상품 API 테스트 요청");
        return ResponseEntity.ok(ApiResponse.success("상품 API가 정상적으로 작동합니다.", "OK"));
    }

    /**
     * 모든 상품 조회 (페이징)
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<FinancialProduct>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("상품 조회 요청 - page: {}, size: {}", page, size);
        try {
            Page<FinancialProduct> products = productService.getAllProducts(page, size);
            return ResponseEntity.ok(ApiResponse.success("상품 조회 성공", products));
        } catch (Exception e) {
            log.error("상품 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 모든 상품 조회 (전체)
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FinancialProduct>>> getAllProductsList() {
        log.info("전체 상품 조회 요청");
        try {
            List<FinancialProduct> products = productService.getAllProducts();
            return ResponseEntity.ok(ApiResponse.success("전체 상품 조회 성공", products));
        } catch (Exception e) {
            log.error("전체 상품 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("전체 상품 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 타입별 조회
     */
    @GetMapping("/type/{productType}")
    public ResponseEntity<ApiResponse<List<FinancialProduct>>> getProductsByType(
            @PathVariable String productType) {
        log.info("상품 타입별 조회 요청 - productType: {}", productType);
        try {
            List<FinancialProduct> products = productService.getProductsByType(productType);
            return ResponseEntity.ok(ApiResponse.success("상품 타입별 조회 성공", products));
        } catch (Exception e) {
            log.error("상품 타입별 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 타입별 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 검색
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<FinancialProduct>>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("상품 검색 요청 - keyword: {}, page: {}, size: {}", keyword, page, size);
        try {
            Page<FinancialProduct> products = productService.searchProducts(keyword, page, size);
            return ResponseEntity.ok(ApiResponse.success("상품 검색 성공", products));
        } catch (Exception e) {
            log.error("상품 검색 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 검색 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 상세 정보 조회
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<FinancialProduct>> getProductById(@PathVariable String productId) {
        // URL 디코딩 처리
        try {
            productId = java.net.URLDecoder.decode(productId, "UTF-8");
        } catch (Exception e) {
            log.warn("URL 디코딩 실패: {}", e.getMessage());
        }
        
        log.info("상품 상세 조회 요청 - productId: {}", productId);
        try {
            Optional<FinancialProduct> product = productService.getProductById(productId);
            if (product.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("상품 상세 조회 성공", product.get()));
            } else {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }
        } catch (Exception e) {
            log.error("상품 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 상세 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품별 설명서 정보 조회
     */
    @GetMapping("/{productId}/document")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductDocument(@PathVariable String productId) {
        // URL 디코딩 처리
        try {
            productId = java.net.URLDecoder.decode(productId, "UTF-8");
        } catch (Exception e) {
            log.warn("URL 디코딩 실패: {}", e.getMessage());
        }
        
        log.info("상품 설명서 조회 요청 - productId: {}", productId);
        try {
            Optional<FinancialProduct> product = productService.getProductById(productId);
            if (product.isPresent()) {
                FinancialProduct productData = product.get();
                Map<String, Object> documentInfo = new HashMap<>();
                documentInfo.put("productId", productData.getProductId());
                documentInfo.put("productName", productData.getProductName());
                documentInfo.put("documentPath", productData.getDocumentPath());
                documentInfo.put("documentName", productData.getDocumentName());
                documentInfo.put("hasDocument", productData.getDocumentPath() != null && !productData.getDocumentPath().isEmpty());
                
                return ResponseEntity.ok(ApiResponse.success("상품 설명서 조회 성공", documentInfo));
            } else {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }
        } catch (Exception e) {
            log.error("상품 설명서 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 설명서 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 설명서 업데이트
     */
    @PutMapping("/{productId}/document")
    public ResponseEntity<ApiResponse<FinancialProduct>> updateProductDocument(
            @PathVariable String productId,
            @RequestBody Map<String, String> documentData) {
        log.info("상품 설명서 업데이트 요청 - productId: {}, documentData: {}", productId, documentData);
        try {
            Optional<FinancialProduct> productOpt = productService.getProductById(productId);
            if (productOpt.isPresent()) {
                FinancialProduct product = productOpt.get();
                product.setDocumentPath(documentData.get("documentPath"));
                product.setDocumentName(documentData.get("documentName"));
                
                FinancialProduct updatedProduct = productService.saveProduct(product);
                return ResponseEntity.ok(ApiResponse.success("상품 설명서 업데이트 성공", updatedProduct));
            } else {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }
        } catch (Exception e) {
            log.error("상품 설명서 업데이트 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 설명서 업데이트 중 오류가 발생했습니다.")
            );
        }
    } ResponseEntity<ApiResponse<Map<String, Object>>> getProductDetail(@PathVariable String productId) {
        log.info("상품 상세 정보 조회 요청 - productId: {}", productId);
        try {
            Optional<FinancialProduct> productOpt = productService.getProductById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }

            FinancialProduct product = productOpt.get();
            Map<String, Object> result = new HashMap<>();
            result.put("product", product);

            // 상품 타입에 따라 금리 정보 추가
            if ("예금".equals(product.getProductType()) || "적금".equals(product.getProductType())) {
                List<ProductRate> productRates = productService.getProductRates(productId);
                result.put("rates", productRates);
            } else if ("대출".equals(product.getProductType())) {
                List<LoanRate> loanRates = productService.getLoanRates(productId);
                result.put("rates", loanRates);
            }

            return ResponseEntity.ok(ApiResponse.success("상품 상세 정보 조회 성공", result));
        } catch (Exception e) {
            log.error("상품 상세 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 상세 정보 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 금리 정보 조회 (예금/적금)
     */
    @GetMapping("/{productId}/rates")
    public ResponseEntity<ApiResponse<List<ProductRate>>> getProductRates(@PathVariable String productId) {
        log.info("상품 금리 정보 조회 요청 - productId: {}", productId);
        try {
            List<ProductRate> rates = productService.getProductRates(productId);
            return ResponseEntity.ok(ApiResponse.success("상품 금리 정보 조회 성공", rates));
        } catch (Exception e) {
            log.error("상품 금리 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 금리 정보 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 대출 금리 정보 조회
     */
    @GetMapping("/{productId}/loan-rates")
    public ResponseEntity<ApiResponse<List<LoanRate>>> getLoanRates(@PathVariable String productId) {
        log.info("대출 금리 정보 조회 요청 - productId: {}", productId);
        try {
            List<LoanRate> rates = productService.getLoanRates(productId);
            return ResponseEntity.ok(ApiResponse.success("대출 금리 정보 조회 성공", rates));
        } catch (Exception e) {
            log.error("대출 금리 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("대출 금리 정보 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 모든 상품 타입 조회
     */
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<String>>> getAllProductTypes() {
        log.info("모든 상품 타입 조회 요청");
        try {
            List<String> types = productService.getAllProductTypes();
            return ResponseEntity.ok(ApiResponse.success("상품 타입 조회 성공", types));
        } catch (Exception e) {
            log.error("상품 타입 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 타입 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 가입 시 필요한 EForm 목록 조회
     */
    @GetMapping("/{productId}/forms")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductForms(@PathVariable String productId) {
        // URL 디코딩 처리
        try {
            productId = java.net.URLDecoder.decode(productId, "UTF-8");
        } catch (Exception e) {
            log.warn("URL 디코딩 실패: {}", e.getMessage());
        }
        
        log.info("상품 가입 시 필요한 EForm 목록 조회 요청 - productId: {}", productId);
        try {
            Optional<FinancialProduct> productOpt = productService.getProductById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }

            FinancialProduct product = productOpt.get();
            Map<String, Object> result = new HashMap<>();
            result.put("product", product);

            // 4개의 기본 서식 반환 (FormsController와 동일한 구조)
            List<Map<String, Object>> forms = createDefaultForms();
            result.put("forms", forms);

            log.info("✅ 4개 기본 서식 반환 완료 - productId: {}", productId);
            return ResponseEntity.ok(ApiResponse.success("상품 가입 시 필요한 EForm 목록 조회 성공", result));
        } catch (Exception e) {
            log.error("상품 가입 시 필요한 EForm 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 가입 시 필요한 EForm 목록 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 우대금리 비교 - 적금 상품 순위 조회
     */
    @GetMapping("/savings/compare")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> compareSavingsProducts() {
        log.info("적금 상품 우대금리 비교 요청");
        try {
            List<Map<String, Object>> comparison = productService.getSavingsComparison();
            return ResponseEntity.ok(ApiResponse.success("적금 상품 비교 조회 성공", comparison));
        } catch (Exception e) {
            log.error("적금 상품 비교 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("적금 상품 비교 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 특정 상품의 우대금리 상세 정보 조회
     */
    @GetMapping("/savings/{productName}/preferential-details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPreferentialDetails(@PathVariable String productName) {
        log.info("상품 우대금리 상세 정보 조회 요청 - productName: {}", productName);
        try {
            Map<String, Object> details = productService.getPreferentialDetails(productName);
            if (details == null) {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }
            return ResponseEntity.ok(ApiResponse.success("우대금리 상세 정보 조회 성공", details));
        } catch (Exception e) {
            log.error("우대금리 상세 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("우대금리 상세 정보 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 통합 금융상품 비교 (적금 + 예금)
     */
    @GetMapping("/compare/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> compareAllProducts() {
        log.info("통합 금융상품 비교 요청");
        try {
            List<Map<String, Object>> comparison = productService.getAllProductsComparison();
            return ResponseEntity.ok(ApiResponse.success("통합 상품 비교 조회 성공", comparison));
        } catch (Exception e) {
            log.error("통합 상품 비교 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("통합 상품 비교 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 상품 상세 정보 조회 (product_details 테이블 기반)
     */
    @GetMapping("/{productId}/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductDetails(@PathVariable String productId) {
        // URL 디코딩 처리
        try {
            productId = java.net.URLDecoder.decode(productId, "UTF-8");
        } catch (Exception e) {
            log.warn("URL 디코딩 실패: {}", e.getMessage());
        }
        
        log.info("상품 상세 정보 조회 요청 - productId: {}", productId);
        try {
            // 먼저 기본 상품 정보 조회
            Optional<FinancialProduct> productOpt = productService.getProductById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.status(404).body(
                    ApiResponse.error("상품을 찾을 수 없습니다.")
                );
            }

            FinancialProduct product = productOpt.get();
            Map<String, Object> result = new HashMap<>();
            result.put("product", product);

            // product_details 테이블에서 상세 정보 조회
            Map<String, Object> productDetails = productService.getProductDetailsByName(product.getProductName());
            if (productDetails != null) {
                result.put("hasDetailedInfo", true);
                result.put("detailedInfo", productDetails);
                log.info("상품 상세 정보 발견: {}", product.getProductName());
            } else {
                result.put("hasDetailedInfo", false);
                log.info("상품 상세 정보 없음, 기본 정보만 제공: {}", product.getProductName());
            }

            return ResponseEntity.ok(ApiResponse.success("상품 상세 정보 조회 성공", result));
        } catch (Exception e) {
            log.error("상품 상세 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 상세 정보 조회 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * product_details 테이블에서 모든 상품 정보 조회 (우대금리 포함)
     */
    @GetMapping("/details")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllProductDetails() {
        log.info("모든 상품 상세 정보 조회 요청");
        try {
            List<Map<String, Object>> productDetails = productService.getProductDetails();
            log.info("조회된 상품 수: {}", productDetails.size());
            if (productDetails.isEmpty()) {
                // 빈 결과라도 200으로 반환하여 프론트가 빈 상태를 표시하도록 함
                return ResponseEntity.ok(ApiResponse.success("상품 상세 정보 없음", productDetails));
            }
            return ResponseEntity.ok(ApiResponse.success("상품 상세 정보 조회 성공", productDetails));
        } catch (Exception e) {
            log.error("상품 상세 정보 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("상품 상세 정보 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * product_details 테이블에서 모든 우대금리 조건 추출
     */
    @GetMapping("/preferential-conditions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPreferentialConditions() {
        log.info("우대금리 조건 조회 요청");
        try {
            List<Map<String, Object>> conditions = productService.getPreferentialConditions();
            log.info("조회된 우대금리 조건 수: {}", conditions.size());
            if (conditions.isEmpty()) {
                // 빈 결과라도 200으로 반환하여 프론트가 빈 상태를 표시하도록 함
                return ResponseEntity.ok(ApiResponse.success("우대금리 조건 없음", conditions));
            }
            return ResponseEntity.ok(ApiResponse.success("우대금리 조건 조회 성공", conditions));
        } catch (Exception e) {
            log.error("우대금리 조건 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("우대금리 조건 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * Supabase에서 모든 상품 데이터 조회 (279개 상품)
     */
    @GetMapping("/supabase/all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllProductsFromSupabase() {
        log.info("Supabase에서 모든 상품 데이터 조회 요청");
        try {
            List<Map<String, Object>> products = productService.getAllProductsFromSupabase();
            log.info("Supabase에서 조회된 상품 수: {}", products.size());
            return ResponseEntity.ok(ApiResponse.success("Supabase 상품 데이터 조회 성공", products));
        } catch (Exception e) {
            log.error("Supabase 상품 데이터 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Supabase 상품 데이터 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * Supabase에서 상품 타입별 조회
     */
    @GetMapping("/supabase/type/{productType}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductsByTypeFromSupabase(
            @PathVariable String productType) {
        log.info("Supabase에서 상품 타입별 조회 요청 - productType: {}", productType);
        try {
            List<Map<String, Object>> products = productService.getProductsByTypeFromSupabase(productType);
            log.info("Supabase에서 조회된 {} 상품 수: {}", productType, products.size());
            return ResponseEntity.ok(ApiResponse.success("Supabase 상품 타입별 조회 성공", products));
        } catch (Exception e) {
            log.error("Supabase 상품 타입별 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Supabase 상품 타입별 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * Supabase에서 판매중인 상품만 조회
     */
    @GetMapping("/supabase/active")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveProductsFromSupabase() {
        log.info("Supabase에서 판매중인 상품 조회 요청");
        try {
            List<Map<String, Object>> products = productService.getActiveProductsFromSupabase();
            log.info("Supabase에서 조회된 판매중 상품 수: {}", products.size());
            return ResponseEntity.ok(ApiResponse.success("Supabase 판매중 상품 조회 성공", products));
        } catch (Exception e) {
            log.error("Supabase 판매중 상품 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Supabase 판매중 상품 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * Supabase에서 상품과 우대금리 정보를 함께 조회
     */
    @GetMapping("/supabase/with-benefits")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductsWithBenefitsFromSupabase() {
        log.info("Supabase에서 상품과 우대금리 정보 조회 요청");
        try {
            List<Map<String, Object>> products = productService.getProductsWithBenefitsFromSupabase();
            log.info("Supabase에서 조회된 상품 수 (우대금리 포함): {}", products.size());
            return ResponseEntity.ok(ApiResponse.success("Supabase 상품 및 우대금리 조회 성공", products));
        } catch (Exception e) {
            log.error("Supabase 상품 및 우대금리 조회 중 오류 발생", e);
            return ResponseEntity.status(500).body(
                ApiResponse.error("Supabase 상품 및 우대금리 조회 중 오류가 발생했습니다: " + e.getMessage())
            );
        }
    }

    /**
     * 4개의 기본 서식 생성 (FormsController와 동일한 구조)
     */
    private List<Map<String, Object>> createDefaultForms() {
        return List.of(
            createConsentForm(),
            createApplicationForm(),
            createElectronicFinanceForm(),
            createFinancialPurposeForm()
        );
    }

    private Map<String, Object> createFieldMap(String id, String name, String type, boolean required) {
        Map<String, Object> field = new HashMap<>();
        field.put("id", id);
        field.put("name", name);
        field.put("type", type);
        field.put("required", required);
        return field;
    }

    private Map<String, Object> createConsentForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("customer_name", "고객명", "text", true),
            createFieldMap("customer_id", "주민등록번호", "text", true),
            createFieldMap("phone", "연락처", "text", true),
            createFieldMap("address", "주소", "text", true),
            createFieldMap("consent_agree", "개인정보 수집·이용 동의", "checkbox", true),
            createFieldMap("consentDate", "동의일자", "date", true),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "consent_form");
        form.put("formName", "개인정보 수집·이용 동의서");
        form.put("formType", "consent");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/consent_form.pdf");
        form.put("formSchema", formSchema);
        form.put("description", "개인정보 수집 및 이용에 대한 동의서");
        form.put("versionNumber", "1.0");
        form.put("isCommon", true);
        return form;
    }

    private Map<String, Object> createApplicationForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("account_type", "계좌 유형", "select", true),
            createFieldMap("initial_deposit", "초기 입금액", "number", true),
            createFieldMap("signature", "서명", "signature", true),
            createFieldMap("applicationDate", "신청일자", "date", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "application_form");
        form.put("formName", "은행거래신청서");
        form.put("formType", "application");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/application_form.pdf");
        form.put("formSchema", formSchema);
        form.put("description", "은행 거래 신청을 위한 서식");
        form.put("versionNumber", "1.0");
        form.put("isCommon", true);
        return form;
    }

    private Map<String, Object> createElectronicFinanceForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("electronic_consent", "전자금융거래 동의", "checkbox", true),
            createFieldMap("mobile_banking", "모바일뱅킹 이용", "checkbox", false),
            createFieldMap("internet_banking", "인터넷뱅킹 이용", "checkbox", false),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "electronic_finance_form");
        form.put("formName", "전자금융거래 이용약관 동의서");
        form.put("formType", "electronic");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/electronic_finance_form.pdf");
        form.put("formSchema", formSchema);
        form.put("description", "전자금융거래 이용약관에 대한 동의서");
        form.put("versionNumber", "1.0");
        form.put("isCommon", true);
        return form;
    }

    private Map<String, Object> createFinancialPurposeForm() {
        Map<String, Object> formSchema = new HashMap<>();
        formSchema.put("fields", List.of(
            createFieldMap("financial_purpose", "금융거래목적", "select", true),
            createFieldMap("purpose_detail", "목적 상세", "text", false),
            createFieldMap("signature", "서명", "signature", true)
        ));
        
        Map<String, Object> form = new HashMap<>();
        form.put("formId", "financial_purpose_confirmation");
        form.put("formName", "금융거래목적확인서");
        form.put("formType", "purpose");
        form.put("isReactForm", true);
        form.put("isHtmlForm", true);
        form.put("url", "/forms/financial_purpose_confirmation.pdf");
        form.put("formSchema", formSchema);
        form.put("description", "금융거래목적 확인을 위한 서식");
        form.put("versionNumber", "1.0");
        form.put("isCommon", true);
        return form;
    }
}


