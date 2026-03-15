package com.mahyhaker.hcm.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Data inicial é obrigatória")
    private LocalDate startDate;

    @NotNull(message = "Data final é obrigatória")
    private LocalDate endDate;

    @NotNull(message = "Tipo é obrigatório")
    @Enumerated(EnumType.STRING)
    private LeaveType type;

    @Enumerated(EnumType.STRING)
    private LeaveStatus status;

    @NotBlank(message = "Motivo é obrigatório")
    private String reason;

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    public LeaveRequest() {
    }

    public Long getId() {
        return id;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LeaveType getType() {
        return type;
    }

    public void setType(LeaveType type) {
        this.type = type;
    }

    public LeaveStatus getStatus() {
        return status;
    }

    public void setStatus(LeaveStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}