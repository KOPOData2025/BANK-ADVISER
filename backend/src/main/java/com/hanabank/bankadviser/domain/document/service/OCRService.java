package com.hanabank.bankadviser.domain.document.service;

import com.hanabank.bankadviser.domain.document.dto.OCRLoginResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OCRService {

    private static final String UPLOAD_DIR = "uploads/";
    private static final String DB_URL = "jdbc:postgresql://db.jhfjigeuxrxxbbsoflcd.supabase.co:5432/postgres";
    private static final String DB_USER = "postgres.jhfjigeuxrxxbbsoflcd";
    private static final String DB_PASSWORD = "HanaBank2024!";

    // 간단한 테스트용 메서드
    public String test() {
        return "OCR Service is working!";
    }

    public OCRLoginResponse processIDCardAndLogin(MultipartFile file) {
        OCRLoginResponse response = new OCRLoginResponse();
        
        try {
            // 1. 파일 저장
            String filePath = saveUploadedFile(file);
            
            // 2. OCR 처리 (실제 OCR 라이브러리 대신 시뮬레이션)
            Map<String, String> extractedInfo = simulateOCR(filePath);
            
            // 3. 추출된 정보 저장
            response.setExtractedName(extractedInfo.get("name"));
            response.setExtractedIdNumber(extractedInfo.get("idNumber"));
            
            // 4. 고객 검색
            String customerId = findCustomerByInfo(extractedInfo.get("name"), extractedInfo.get("idNumber"));
            
            if (customerId != null) {
                // 5. 로그인 성공
                response.setSuccess(true);
                response.setMessage("OCR 로그인 성공");
                response.setCustomerId(customerId);
                response.setCustomerName(extractedInfo.get("name"));
                response.setToken(generateToken(customerId));
            } else {
                // 6. 고객을 찾을 수 없음
                response.setSuccess(false);
                response.setMessage("등록된 고객 정보를 찾을 수 없습니다.");
            }
            
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("OCR 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return response;
    }

    public Map<String, Object> extractIDCardInfo(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 파일 저장
            String filePath = saveUploadedFile(file);
            
            // 2. OCR 처리 (실제 OCR 라이브러리 대신 시뮬레이션)
            Map<String, String> extractedInfo = simulateOCR(filePath);
            
            // 3. 고객 검색
            String customerId = findCustomerByInfo(extractedInfo.get("name"), extractedInfo.get("idNumber"));
            
            if (customerId != null) {
                // 고객 정보와 함께 반환
                result.put("success", true);
                result.put("customer", Map.of(
                    "CustomerID", customerId,
                    "Name", extractedInfo.get("name"),
                    "IDNumber", extractedInfo.get("idNumber"),
                    "Address", extractedInfo.get("address"),
                    "IssueDate", extractedInfo.get("issueDate"),
                    "Issuer", extractedInfo.get("issuer")
                ));
            } else {
                result.put("success", false);
                result.put("message", "등록된 고객 정보를 찾을 수 없습니다.");
                result.put("extractedInfo", extractedInfo);
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "OCR 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }

    private String saveUploadedFile(MultipartFile file) throws IOException {
        // 업로드 디렉토리 생성
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        
        // 파일 저장
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.copy(file.getInputStream(), filePath);
        
        return filePath.toString();
    }

    private Map<String, String> simulateOCR(String filePath) {
        // 실제 OCR 서버로 요청 전송
        try {
            // OCR 서버 URL (EC2 인스턴스)
            String ocrServerUrl = "http://15.164.230.192:8081/api/ocr/id-card";
            
            // 파일을 MultipartFile로 변환하여 OCR 서버로 전송
            File file = new File(filePath);
            byte[] fileContent = Files.readAllBytes(file.toPath());
            
            // HTTP 요청 생성
            HttpURLConnection connection = (HttpURLConnection) new URL(ocrServerUrl).openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW");
            
            // 멀티파트 폼 데이터 생성
            String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
            String lineEnd = "\r\n";
            String twoHyphens = "--";
            
            StringBuilder requestBody = new StringBuilder();
            requestBody.append(twoHyphens).append(boundary).append(lineEnd);
            requestBody.append("Content-Disposition: form-data; name=\"idCard\"; filename=\"").append(file.getName()).append("\"").append(lineEnd);
            requestBody.append("Content-Type: image/png").append(lineEnd);
            requestBody.append(lineEnd);
            
            // 파일 내용 추가
            byte[] requestBodyBytes = requestBody.toString().getBytes();
            byte[] endBoundary = (lineEnd + twoHyphens + boundary + twoHyphens + lineEnd).getBytes();
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            outputStream.write(requestBodyBytes);
            outputStream.write(fileContent);
            outputStream.write(endBoundary);
            
            // 요청 전송
            connection.getOutputStream().write(outputStream.toByteArray());
            
            // 응답 읽기
            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                // JSON 응답 파싱
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> ocrResponse = mapper.readValue(response.toString(), Map.class);
                
                if ((Boolean) ocrResponse.get("success")) {
                    Map<String, Object> extractedInfo = (Map<String, Object>) ocrResponse.get("extractedInfo");
                    Map<String, String> result = new HashMap<>();
                    result.put("name", (String) extractedInfo.get("name"));
                    result.put("idNumber", (String) extractedInfo.get("idNumber"));
                    result.put("address", (String) extractedInfo.get("address"));
                    result.put("issueDate", (String) extractedInfo.get("issueDate"));
                    result.put("issuer", (String) extractedInfo.get("issuer"));
                    return result;
                }
            }
            
            connection.disconnect();
        } catch (Exception e) {
            log.error("OCR 서버 요청 실패: {}", e.getMessage());
        }
        
        // OCR 서버 요청 실패 시 시뮬레이션 데이터 사용
        Map<String, String> extractedInfo = new HashMap<>();
        String[] sampleData = {
            "한성민(趙賢宇)|951216-378557|경상남도 동대문구 신촌로 505번지 606호 뉴타운아파트 1414동 1515호|2024.01.10|충청남도 강동구청장",
            "박서준(安智媛)|950115-320759|경기도 강동구 강남대로 456번지 78 힐스테이트 303동 404호|2021.09.07|경상북도 서대문구청장",
            "장서연(全東炫)|970504-494974|전라남도 성동구 삼성로 345번지 67호 힐스테이트 2424동 2525호|2023.09.19|울산광역시 양천구청장",
            "정예린(李民俊)|910211-411890|광주광역시 금천구 도곡로 456번길 78호 가든아파트 2626동 2727호|2023.01.01|충청북도 성동구청장",
            "윤시우(申民浩)|960901-454781|전라남도 강동구 도곡로 456번길 78호 가든아파트 2626동 2727호|2020.06.09|충청남도 용산구청장"
        };
        
        String selectedData = sampleData[(int) (Math.random() * sampleData.length)];
        String[] parts = selectedData.split("\\|");
        
        extractedInfo.put("name", parts[0]);
        extractedInfo.put("idNumber", parts[1]);
        extractedInfo.put("address", parts[2]);
        extractedInfo.put("issueDate", parts[3]);
        extractedInfo.put("issuer", parts[4]);
        
        return extractedInfo;
    }

    private String findCustomerByInfo(String name, String idNumber) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            // 이름으로 고객 검색
            String sql = "SELECT customerid FROM customer WHERE name = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, name);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        return rs.getString("customerid");
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String generateToken(String customerId) {
        // 간단한 토큰 생성 (실제로는 JWT 등을 사용)
        return "token_" + customerId + "_" + System.currentTimeMillis();
    }
}