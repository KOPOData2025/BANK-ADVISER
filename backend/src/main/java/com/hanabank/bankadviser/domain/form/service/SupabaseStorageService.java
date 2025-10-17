package com.hanabank.bankadviser.domain.form.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service.key}")
    private String supabaseServiceKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 파일을 Supabase Storage에 업로드
     * @param file 업로드할 파일
     * @param bucketName 버킷 이름
     * @param fileName 파일명
     * @return 업로드된 파일의 공개 URL
     */
    public String uploadFile(MultipartFile file, String bucketName, String fileName) {
        try {
            String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, fileName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", "Bearer " + supabaseServiceKey);
            headers.set("apikey", supabaseServiceKey);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, fileName);
                log.info("파일 업로드 성공: {}", publicUrl);
                return publicUrl;
            } else {
                log.error("파일 업로드 실패: {}", response.getBody());
                throw new RuntimeException("파일 업로드에 실패했습니다: " + response.getBody());
            }

        } catch (Exception e) {
            log.error("파일 업로드 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * JSON 데이터를 파일로 변환하여 업로드
     * @param jsonData JSON 데이터
     * @param bucketName 버킷 이름
     * @param fileName 파일명
     * @return 업로드된 파일의 공개 URL
     */
    public String uploadJsonData(Object jsonData, String bucketName, String fileName) {
        try {
            String jsonString = objectMapper.writeValueAsString(jsonData);
            byte[] jsonBytes = jsonString.getBytes("UTF-8");
            
            // MultipartFile을 생성하기 위한 임시 클래스
            MultipartFile jsonFile = new MultipartFile() {
                @Override
                public String getName() {
                    return "file";
                }

                @Override
                public String getOriginalFilename() {
                    return fileName;
                }

                @Override
                public String getContentType() {
                    return "application/json";
                }

                @Override
                public boolean isEmpty() {
                    return jsonBytes.length == 0;
                }

                @Override
                public long getSize() {
                    return jsonBytes.length;
                }

                @Override
                public byte[] getBytes() throws IOException {
                    return jsonBytes;
                }

                @Override
                public java.io.InputStream getInputStream() throws IOException {
                    return new java.io.ByteArrayInputStream(jsonBytes);
                }

                @Override
                public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
                    throw new UnsupportedOperationException("transferTo not supported");
                }

                @Override
                public org.springframework.core.io.Resource getResource() {
                    return new org.springframework.core.io.ByteArrayResource(jsonBytes) {
                        @Override
                        public String getFilename() {
                            return fileName;
                        }
                    };
                }
            };

            return uploadFile(jsonFile, bucketName, fileName);

        } catch (Exception e) {
            log.error("JSON 데이터 업로드 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("JSON 데이터 업로드 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 고유한 파일명 생성
     * @param customerName 고객명
     * @param formName 서식명
     * @param extension 파일 확장자
     * @return 고유한 파일명
     */
    public String generateUniqueFileName(String customerName, String formName, String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String sanitizedCustomerName = customerName.replaceAll("[^a-zA-Z0-9가-힣]", "_");
        String sanitizedFormName = formName.replaceAll("[^a-zA-Z0-9가-힣]", "_");
        
        return String.format("%s_%s_%s.%s", sanitizedCustomerName, sanitizedFormName, timestamp, extension);
    }

    /**
     * 파일 삭제
     * @param bucketName 버킷 이름
     * @param fileName 파일명
     * @return 삭제 성공 여부
     */
    public boolean deleteFile(String bucketName, String fileName) {
        try {
            String deleteUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, fileName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseServiceKey);
            headers.set("apikey", supabaseServiceKey);

            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                deleteUrl,
                HttpMethod.DELETE,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("파일 삭제 성공: {}", fileName);
                return true;
            } else {
                log.error("파일 삭제 실패: {}", response.getBody());
                return false;
            }

        } catch (Exception e) {
            log.error("파일 삭제 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
}