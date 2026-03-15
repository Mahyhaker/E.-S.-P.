package com.mahyhaker.hcm.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.LeaveRequest;
import com.mahyhaker.hcm.model.LeaveStatus;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.LeaveRepository;

@Service
public class LeaveRequestService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveRequestService(LeaveRepository leaveRepository, EmployeeRepository employeeRepository) {
        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
    }

    public LeaveRequest create(LeaveRequest leaveRequest) {
        if (leaveRequest.getEmployee() == null || leaveRequest.getEmployee().getId() == null) {
            throw new IllegalArgumentException("Funcionário é obrigatório.");
        }

        if (leaveRequest.getStartDate() == null || leaveRequest.getEndDate() == null) {
            throw new IllegalArgumentException("Data inicial e data final são obrigatórias.");
        }

        if (leaveRequest.getStartDate().isAfter(leaveRequest.getEndDate())) {
            throw new IllegalArgumentException("A data inicial não pode ser maior que a data final.");
        }

        Employee employee = employeeRepository.findById(leaveRequest.getEmployee().getId())
                .orElseThrow(() -> new IllegalArgumentException("Funcionário não encontrado."));

        boolean hasOverlap = leaveRepository
                .existsByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employee.getId(),
                        LeaveStatus.APPROVED,
                        leaveRequest.getEndDate(),
                        leaveRequest.getStartDate());

        if (hasOverlap) {
            throw new IllegalArgumentException("Já existe uma ausência aprovada para este funcionário nesse período.");
        }

        leaveRequest.setEmployee(employee);
        leaveRequest.setStatus(LeaveStatus.PENDING);

        return leaveRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getAll() {
        return leaveRepository.findAll();
    }

    public List<LeaveRequest> getByEmployee(Long employeeId) {
        return leaveRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    public List<LeaveRequest> getPendingByManager(Long managerId) {
        return leaveRepository.findByStatusAndEmployeeManagerIdOrderByStartDateAsc(LeaveStatus.PENDING, managerId);
    }

    public List<LeaveRequest> getPendingForHr() {
        return leaveRepository.findByStatusAndEmployeeManagerIsNullOrderByStartDateAsc(LeaveStatus.PENDING);
    }

    public LeaveRequest approve(Long id) {
        LeaveRequest leaveRequest = leaveRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitação não encontrada."));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Somente solicitações pendentes podem ser aprovadas.");
        }

        boolean hasOverlap = leaveRepository
                .existsByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        leaveRequest.getEmployee().getId(),
                        LeaveStatus.APPROVED,
                        leaveRequest.getEndDate(),
                        leaveRequest.getStartDate());

        if (hasOverlap) {
            throw new IllegalArgumentException("Já existe uma ausência aprovada para este funcionário nesse período.");
        }

        leaveRequest.setStatus(LeaveStatus.APPROVED);
        return leaveRepository.save(leaveRequest);
    }

    public LeaveRequest reject(Long id) {
        LeaveRequest leaveRequest = leaveRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitação não encontrada."));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Somente solicitações pendentes podem ser rejeitadas.");
        }

        leaveRequest.setStatus(LeaveStatus.REJECTED);
        return leaveRepository.save(leaveRequest);
    }
}