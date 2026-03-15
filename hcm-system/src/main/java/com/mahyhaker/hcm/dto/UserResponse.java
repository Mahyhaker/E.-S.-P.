package com.mahyhaker.hcm.dto;

public class UserResponse {

    private Long id;
    private String username;
    private String role;
    private Boolean active;
    private Long employeeId;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String role, Boolean active, Long employeeId) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.active = active;
        this.employeeId = employeeId;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public Boolean getActive() {
        return active;
    }

    public Long getEmployeeId() {
        return employeeId;
    }
}