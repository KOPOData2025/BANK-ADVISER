package com.hanabank.bankadviser.domain.code.service;

import com.hanabank.bankadviser.domain.code.entity.CodeGroup;
import com.hanabank.bankadviser.domain.code.entity.CodeValue;
import com.hanabank.bankadviser.domain.code.repository.CodeGroupRepository;
import com.hanabank.bankadviser.domain.code.repository.CodeValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CodeService {
    private final CodeGroupRepository codeGroupRepository;
    private final CodeValueRepository codeValueRepository;

    public List<CodeGroup> getAllGroups() {
        return codeGroupRepository.findAll();
    }

    public List<CodeValue> getValuesByGroup(String codeGroupId) {
        return codeValueRepository.findByCodeGroupIdOrderByCodeValueAsc(codeGroupId);
    }
}


