package com.mahyhaker.hcm.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.dto.PersonalDataResponse;
import com.mahyhaker.hcm.dto.UpdatePersonalDataRequest;
import com.mahyhaker.hcm.service.PersonalDataService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/personal-data")
public class PersonalDataController {

    private final PersonalDataService service;

    public PersonalDataController(PersonalDataService service) {
        this.service = service;
    }

    @PreAuthorize("hasRole('HR')")
    @GetMapping("/me")
    public PersonalDataResponse getOwn(Authentication authentication) {
        return service.getOwn(authentication.getName());
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/me")
    public PersonalDataResponse saveOwn(Authentication authentication,
                                        @Valid @RequestBody UpdatePersonalDataRequest request) {
        return service.saveOwn(authentication.getName(), request);
    }

    @PreAuthorize("hasRole('HR')")
    @GetMapping("/employee/{employeeId}")
    public PersonalDataResponse getForEmployee(@PathVariable Long employeeId, Authentication authentication) {
        return service.getForEmployee(employeeId, authentication.getName());
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/employee/{employeeId}")
    public PersonalDataResponse saveForEmployee(@PathVariable Long employeeId,
                                                Authentication authentication,
                                                @Valid @RequestBody UpdatePersonalDataRequest request) {
        return service.saveForEmployee(employeeId, authentication.getName(), request);
    }
}
