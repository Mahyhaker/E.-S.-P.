package com.mahyhaker.hcm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.OrganizationalAssignment;

public interface OrganizationalAssignmentRepository extends JpaRepository<OrganizationalAssignment, Long> {

    List<OrganizationalAssignment> findByManagerId(Long managerId);

    void deleteByEmployeeId(Long employeeId);
}
