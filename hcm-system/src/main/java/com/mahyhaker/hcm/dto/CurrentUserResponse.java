package com.mahyhaker.hcm.dto;

public class CurrentUserResponse {

    private Long id;
    private String username;
    private String role;
    private boolean active;
    private Long employeeId;
    private String employeeName;
    private String position;
    private String departmentName;
    private String managerName;

    public CurrentUserResponse(Long id,
                               String username,
                               String role,
                               boolean active,
                               Long employeeId,
                               String employeeName,
                               String position,
                               String departmentName,
                               String managerName) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.active = active;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.position = position;
        this.departmentName = departmentName;
        this.managerName = managerName;
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

    public boolean isActive() {
        return active;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public String getPosition() {
        return position;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public String getManagerName() {
        return managerName;
    }
}
