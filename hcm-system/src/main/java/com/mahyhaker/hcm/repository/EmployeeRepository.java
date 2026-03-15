package com.mahyhaker.hcm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findTopByOrderByIdDesc();

    List<Employee> findByManagerId(Long managerId);
}