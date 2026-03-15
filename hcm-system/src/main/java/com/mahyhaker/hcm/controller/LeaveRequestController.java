package com.mahyhaker.hcm.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.model.LeaveRequest;
import com.mahyhaker.hcm.service.LeaveRequestService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/leave-requests")
public class LeaveRequestController {

    private final LeaveRequestService service;

    public LeaveRequestController(LeaveRequestService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    @PostMapping
    public LeaveRequest create(@Valid @RequestBody LeaveRequest leaveRequest) {
        return service.create(leaveRequest);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @GetMapping
    public List<LeaveRequest> getAll() {
        return service.getAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    @GetMapping("/employee/{employeeId}")
    public List<LeaveRequest> getByEmployee(@PathVariable Long employeeId) {
        return service.getByEmployee(employeeId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/pending/manager/{managerId}")
    public List<LeaveRequest> getPendingByManager(@PathVariable Long managerId) {
        return service.getPendingByManager(managerId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @GetMapping("/pending/hr")
    public List<LeaveRequest> getPendingForHr() {
        return service.getPendingForHr();
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    @PutMapping("/{id}/approve")
    public LeaveRequest approve(@PathVariable Long id) {
        return service.approve(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    @PutMapping("/{id}/reject")
    public LeaveRequest reject(@PathVariable Long id) {
        return service.reject(id);
    }
}