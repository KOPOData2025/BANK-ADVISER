package com.hanabank.bankadviser.domain.code.repository;

import com.hanabank.bankadviser.domain.code.entity.CodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodeGroupRepository extends JpaRepository<CodeGroup, String> {
}


