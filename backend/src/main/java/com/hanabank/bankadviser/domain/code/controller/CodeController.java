package com.hanabank.bankadviser.domain.code.controller;

import com.hanabank.bankadviser.domain.code.entity.CodeGroup;
import com.hanabank.bankadviser.domain.code.entity.CodeValue;
import com.hanabank.bankadviser.domain.code.service.CodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CodeController {

    private final CodeService codeService;

    @GetMapping("/groups")
    public ResponseEntity<List<CodeGroup>> getGroups() {
        return ResponseEntity.ok(codeService.getAllGroups());
    }

    @GetMapping("/groups/{codeGroupId}/values")
    public ResponseEntity<List<CodeValue>> getValues(@PathVariable String codeGroupId) {
        return ResponseEntity.ok(codeService.getValuesByGroup(codeGroupId));
    }
}


