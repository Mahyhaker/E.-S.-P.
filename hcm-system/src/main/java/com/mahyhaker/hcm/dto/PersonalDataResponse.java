package com.mahyhaker.hcm.dto;

import java.time.LocalDateTime;

public class PersonalDataResponse {

    private Long employeeId;
    private String fullName;
    private String cpf;
    private String rg;
    private String phone;
    private boolean complete;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public PersonalDataResponse(Long employeeId,
                                String fullName,
                                String cpf,
                                String rg,
                                String phone,
                                boolean complete,
                                LocalDateTime updatedAt,
                                String updatedBy) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.cpf = cpf;
        this.rg = rg;
        this.phone = phone;
        this.complete = complete;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getCpf() {
        return cpf;
    }

    public String getRg() {
        return rg;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isComplete() {
        return complete;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
