package com.mahyhaker.hcm.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
}