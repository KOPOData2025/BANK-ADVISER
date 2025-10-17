package com.hanabank.bankadviser.domain.code.repository;

import com.hanabank.bankadviser.domain.code.entity.CodeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodeValueRepository extends JpaRepository<CodeValue, String> {
    List<CodeValue> findByCodeGroupIdOrderByCodeValueAsc(String codeGroupId);
}


