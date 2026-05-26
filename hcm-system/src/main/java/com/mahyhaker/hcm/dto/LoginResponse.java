package com.mahyhaker.hcm.dto;

public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private Long employeeId;
    private boolean requiresPersonalDataSetup;

    public LoginResponse() {
    }

    public LoginResponse(String token, String username, String role, Long employeeId, boolean requiresPersonalDataSetup) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.employeeId = employeeId;
        this.requiresPersonalDataSetup = requiresPersonalDataSetup;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public boolean isRequiresPersonalDataSetup() {
        return requiresPersonalDataSetup;
    }
}
