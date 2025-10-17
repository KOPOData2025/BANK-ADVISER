package com.hanabank.bankadviser.domain.consultation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SupabaseApiService {

    private String supabaseUrl = "https://jhfjigeuxrxxbbsoflcd.supabase.co";
    private String supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZmppZ2V1eHJ4eGJic29mbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDA1OTksImV4cCI6MjA3MTY3NjU5OX0.aCXzQYf1P1B2lVHUfDlLdjB-iq-ItlPRh6oWRTElRUQ";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> executeQuery(String table, String select, String filter) {
        try {
            String url = supabaseUrl + "/rest/v1/" + table;
            if (select != null) {
                url += "?select=" + select;
            }
            if (filter != null) {
                url += (select != null ? "&" : "?") + filter;
            }

            System.out.println("🔍 [SupabaseApiService] URL: " + url);
            System.out.println("🔍 [SupabaseApiService] API Key: " + (supabaseAnonKey != null && !supabaseAnonKey.isEmpty() ? supabaseAnonKey.substring(0, Math.min(20, supabaseAnonKey.length())) + "..." : "NULL"));

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseAnonKey);
            headers.set("Authorization", "Bearer " + supabaseAnonKey);
            headers.set("Content-Type", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                List<Map<String, Object>> data = objectMapper.readValue(
                    response.getBody(), 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                );
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("data", data);
                result.put("count", data.size());
                return result;
            } else {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }

    public Map<String, Object> getProducts() {
        return executeQuery("product_details", "*", null);
    }

    public Map<String, Object> getCustomer(String customerId) {
        return executeQuery("customers", "*", "customer_id=eq." + customerId);
    }

    public Map<String, Object> getCustomerProducts(String customerId) {
        return executeQuery("customer_products", "*", "customer_id=eq." + customerId);
    }

    public Map<String, Object> getConsultationSessions(String customerId) {
        if (customerId != null) {
            return executeQuery("consultation_sessions", "*", "customer_id=eq." + customerId);
        } else {
            return executeQuery("consultation_sessions", "*", null);
        }
    }

    public Map<String, Object> getConsultationHistory(String customerId) {
        return executeQuery("consultation_history", "*", "customer_id=eq." + customerId);
    }

    public Map<String, Object> getConsultationSessionDetails(String sessionId) {
        return executeQuery("consultation_sessions", "*", "session_id=eq." + sessionId);
    }
}