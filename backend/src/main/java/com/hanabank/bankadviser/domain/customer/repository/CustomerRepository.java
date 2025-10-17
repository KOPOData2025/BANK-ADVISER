package com.hanabank.bankadviser.domain.customer.repository;

import com.hanabank.bankadviser.domain.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    
    Optional<Customer> findByCustomerId(String customerId);
    
    Optional<Customer> findByName(String name);
    
    Optional<Customer> findByContactNumber(String contactNumber);
    
    boolean existsByCustomerId(String customerId);
    
    // 모든 고객을 기본 정보만 조회하는 Native SQL 쿼리 (트랜잭션 없이)
    @Query(value = "SELECT customerid, name, dateofbirth, contactnumber, address, gender, registrationdate FROM customer", nativeQuery = true)
    List<Object[]> findAllCustomersNative();
}


