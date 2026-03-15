package com.mahyhaker.hcm.dto;

public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private Long employeeId;

    public LoginResponse() {
    }

    public LoginResponse(String token, String username, String role, Long employeeId) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.employeeId = employeeId;
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
}