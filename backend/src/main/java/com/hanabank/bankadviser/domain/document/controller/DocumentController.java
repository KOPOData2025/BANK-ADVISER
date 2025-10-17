package com.hanabank.bankadviser.domain.document.controller;

import com.hanabank.bankadviser.domain.product.entity.ProductDocument;
// import com.hanabank.bankadviser.domain.auth.service.RagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    // private final RagService ragService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentName") String documentName,
            @RequestParam("storagePath") String storagePath) {
        
        try {
            log.info("Processing document: {} from path: {}", documentName, storagePath);
            
            // Process the document with RAG (비활성화)
            // ragService.processDocument(file.getBytes(), documentName, storagePath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Document processed successfully");
            response.put("documentName", documentName);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error processing document: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to process document: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getProcessingStatus() {
        // TODO: Implement status checking
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ready");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product-pdf/{pageNumber}")
    @RequestMapping(value = "/product-pdf/{pageNumber}", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<byte[]> getProductPdf(@PathVariable int pageNumber, HttpServletRequest request) {
        try {
            log.info("PDF 요청 - 페이지 번호: {}, 메서드: {}", pageNumber, request.getMethod());
            
            // Supabase Storage URL 구성
            String supabaseUrl = "https://jhfjigeuxrxxbbsoflcd.supabase.co/storage/v1/object/public/hana_product/" + pageNumber + ".pdf";
            
            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set("Content-Disposition", "inline; filename=\"" + pageNumber + ".pdf\"");
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
            headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            
            // HEAD 요청인 경우 바디 없이 헤더만 반환
            if ("HEAD".equals(request.getMethod())) {
                // PDF 파일 크기 확인을 위해 다운로드
                URL url = new URL(supabaseUrl);
                InputStream inputStream = url.openStream();
                byte[] pdfBytes = inputStream.readAllBytes();
                inputStream.close();
                
                headers.setContentLength(pdfBytes.length);
                log.info("PDF HEAD 요청 성공 - 크기: {} bytes", pdfBytes.length);
                
                return new ResponseEntity<>(null, headers, HttpStatus.OK);
            }
            
            // GET 요청인 경우 PDF 파일 다운로드
            URL url = new URL(supabaseUrl);
            InputStream inputStream = url.openStream();
            byte[] pdfBytes = inputStream.readAllBytes();
            inputStream.close();
            
            headers.setContentLength(pdfBytes.length);
            log.info("PDF 다운로드 성공 - 크기: {} bytes", pdfBytes.length);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (IOException e) {
            log.error("PDF 다운로드 실패 - 페이지 번호: {}, 오류: {}", pageNumber, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("PDF 처리 중 오류 발생 - 페이지 번호: {}, 오류: {}", pageNumber, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
