package com.mahyhaker.hcm.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.dto.CurrentUserResponse;
import com.mahyhaker.hcm.dto.UpdateUserRequest;
import com.mahyhaker.hcm.dto.UpdatePasswordRequest;
import com.mahyhaker.hcm.dto.UserResponse;
import com.mahyhaker.hcm.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponse> getAll() {
        return service.getAllUsers();
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    @GetMapping("/me")
    public CurrentUserResponse getMe(Authentication authentication) {
        return service.getCurrentUser(authentication.getName());
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    @PatchMapping("/me/password")
    public void updateOwnPassword(Authentication authentication,
                                  @Valid @RequestBody UpdatePasswordRequest request) {
        service.updateOwnPassword(authentication.getName(), request.getCurrentPassword(), request.getNewPassword());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/employee/{employeeId}")
    public UserResponse updateByEmployeeId(@PathVariable Long employeeId,
                                           @RequestBody UpdateUserRequest request) {
        return service.updateByEmployeeId(employeeId, request);
    }
}
