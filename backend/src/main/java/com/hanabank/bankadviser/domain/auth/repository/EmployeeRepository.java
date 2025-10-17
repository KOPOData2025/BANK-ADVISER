package com.hanabank.bankadviser.domain.auth.repository;

import com.hanabank.bankadviser.domain.auth.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    
    Optional<Employee> findByEmployeeId(String employeeId);
    
    boolean existsByEmployeeId(String employeeId);
}
