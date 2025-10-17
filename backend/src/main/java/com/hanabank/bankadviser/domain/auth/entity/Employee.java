package com.hanabank.bankadviser.domain.auth.entity;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDate;

@Entity
@Table(name = "employee")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {
    
    @Id
    @Column(name = "employeeid", unique = true, nullable = false)
    private String employeeId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "passwordhash")
    private String passwordHash;
    
    @Column(name = "department")
    private String department;
    
    @Column(name = "position")
    private String position;
    
    @Column(name = "contactnumber")
    private String contactNumber;
    
    @Column(name = "hiredate")
    private LocalDate hireDate;
    
    @Column(name = "branchcode")
    private String branchCode;
}
