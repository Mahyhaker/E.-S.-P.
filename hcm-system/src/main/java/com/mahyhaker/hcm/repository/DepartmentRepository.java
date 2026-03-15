package com.mahyhaker.hcm.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}