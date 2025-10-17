package com.hanabank.bankadviser.domain.consultation.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        System.out.println("🎯 TestController /hello 엔드포인트 호출됨!");
        return "TestController 테스트 성공! 🎉";
    }

    @GetMapping("/forms")
    public String forms() {
        System.out.println("🎯 TestController /forms 엔드포인트 호출됨!");
        return "Forms 테스트 성공! 🎉";
    }

    @GetMapping("/simple-recommendations/status")
    public String simpleRecommendationsStatus() {
        System.out.println("🎯 TestController /simple-recommendations/status 엔드포인트 호출됨!");
        return "Simple Recommendations Controller is running!";
    }

    @GetMapping("/working-recommendations/status")
    public String workingRecommendationsStatus() {
        System.out.println("🎯 TestController /working-recommendations/status 엔드포인트 호출됨!");
        return "Working Recommendations Controller is running!";
    }
}





