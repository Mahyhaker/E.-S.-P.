package com.mahyhaker.hcm.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.LeaveRequest;
import com.mahyhaker.hcm.model.LeaveStatus;

public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByStartDateDesc(Long employeeId);

    List<LeaveRequest> findByStatusOrderByStartDateAsc(LeaveStatus status);

    List<LeaveRequest> findByStatusAndEmployeeManagerIdOrderByStartDateAsc(LeaveStatus status, Long managerId);

    List<LeaveRequest> findByStatusAndEmployeeManagerIsNullOrderByStartDateAsc(LeaveStatus status);

    boolean existsByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long employeeId,
            LeaveStatus status,
            LocalDate endDate,
            LocalDate startDate
    );
}