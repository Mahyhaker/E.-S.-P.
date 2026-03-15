package com.mahyhaker.hcm.dto;

public class EmployeeWithUserResponse {

    private Long employeeId;
    private String name;
    private String pernr;
    private String username;
    private String role;

    public EmployeeWithUserResponse() {
    }

    public EmployeeWithUserResponse(Long employeeId, String name, String pernr, String username, String role) {
        this.employeeId = employeeId;
        this.name = name;
        this.pernr = pernr;
        this.username = username;
        this.role = role;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getName() {
        return name;
    }

    public String getPernr() {
        return pernr;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }
}