package com.mahyhaker.hcm.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.dto.DashboardSummary;
import com.mahyhaker.hcm.service.DashboardService;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    @GetMapping("/summary")
    public DashboardSummary getSummary(Authentication authentication) {
        return service.getSummary(authentication.getName());
    }
}
