package com.hanabank.bankadviser.domain.customer.service;

import com.hanabank.bankadviser.domain.customer.entity.CustomerProduct;
import com.hanabank.bankadviser.domain.customer.repository.CustomerProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomerProductService {

    @Autowired
    private CustomerProductRepository customerProductRepository;

    public List<Map<String, Object>> getCustomerProducts(String customerId) {
        List<CustomerProduct> products = customerProductRepository.findByCustomerId(customerId);
        
        return products.stream().map(product -> {
            Map<String, Object> productMap = new HashMap<>();
            productMap.put("productId", product.getProductId() != null ? product.getProductId() : "");
            productMap.put("productName", product.getProductName() != null ? product.getProductName() : "");
            productMap.put("productType", product.getProductType() != null ? product.getProductType() : "");
            productMap.put("accountNumber", product.getAccountNumber() != null ? product.getAccountNumber() : "");
            productMap.put("enrollmentDate", product.getEnrollmentDate() != null ? product.getEnrollmentDate() : "");
            productMap.put("balance", product.getBalance() != null ? product.getBalance() : 0L);
            productMap.put("status", product.getStatus() != null ? product.getStatus() : "active");
            productMap.put("description", product.getDescription() != null ? product.getDescription() : "");
            return productMap;
        }).collect(Collectors.toList());
    }
}
























