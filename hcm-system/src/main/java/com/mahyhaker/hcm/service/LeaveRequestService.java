package com.mahyhaker.hcm.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.exception.NotFoundException;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.LeaveRequest;
import com.mahyhaker.hcm.model.LeaveStatus;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.LeaveRepository;
import com.mahyhaker.hcm.repository.UserRepository;

@Service
public class LeaveRequestService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public LeaveRequestService(LeaveRepository leaveRepository,
                               EmployeeRepository employeeRepository,
                               UserRepository userRepository) {
        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    public LeaveRequest create(LeaveRequest leaveRequest) {
        if (leaveRequest.getEmployee() == null || leaveRequest.getEmployee().getId() == null) {
            throw new IllegalArgumentException("Funcionario e obrigatorio.");
        }

        if (leaveRequest.getStartDate() == null || leaveRequest.getEndDate() == null) {
            throw new IllegalArgumentException("Data inicial e data final sao obrigatorias.");
        }

        if (leaveRequest.getStartDate().isAfter(leaveRequest.getEndDate())) {
            throw new IllegalArgumentException("A data inicial nao pode ser maior que a data final.");
        }

        if (leaveRequest.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("A data inicial nao pode estar no passado.");
        }

        User currentUser = currentUser();
        Employee employee = employeeRepository.findById(leaveRequest.getEmployee().getId())
                .orElseThrow(() -> new NotFoundException("Funcionario nao encontrado."));

        if (!canAccessEmployee(currentUser, employee.getId())) {
            throw new AccessDeniedException("Acesso negado.");
        }

        boolean hasOverlap = leaveRepository
                .existsByEmployeeIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employee.getId(),
                        List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED),
                        leaveRequest.getEndDate(),
                        leaveRequest.getStartDate());

        if (hasOverlap) {
            throw new IllegalArgumentException("Ja existe uma ausencia pendente ou aprovada para este funcionario nesse periodo.");
        }

        leaveRequest.setEmployee(employee);
        leaveRequest.setStatus(LeaveStatus.PENDING);
        leaveRequest.setApprovedAt(null);
        leaveRequest.setApprovedBy(null);
        leaveRequest.setRejectedAt(null);
        leaveRequest.setRejectedBy(null);
        leaveRequest.setRejectionReason(null);

        return leaveRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getAll() {
        return leaveRepository.findAll();
    }

    public List<LeaveRequest> getByEmployee(Long employeeId) {
        if (!canAccessEmployee(currentUser(), employeeId)) {
            throw new AccessDeniedException("Acesso negado.");
        }

        return leaveRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    public List<LeaveRequest> getByManager(Long managerId) {
        User currentUser = currentUser();

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.HR
                && (currentUser.getEmployee() == null || !currentUser.getEmployee().getId().equals(managerId))) {
            throw new AccessDeniedException("Acesso negado.");
        }

        return leaveRepository.findByEmployeeManagerIdOrderByStartDateDesc(managerId);
    }

    public List<LeaveRequest> getPendingByManager(Long managerId) {
        User currentUser = currentUser();

        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.HR
                && (currentUser.getEmployee() == null || !currentUser.getEmployee().getId().equals(managerId))) {
            throw new AccessDeniedException("Acesso negado.");
        }

        return leaveRepository.findByStatusAndEmployeeManagerIdOrderByStartDateAsc(LeaveStatus.PENDING, managerId);
    }

    public List<LeaveRequest> getPendingForHr() {
        return leaveRepository.findByStatusAndEmployeeManagerIsNullOrderByStartDateAsc(LeaveStatus.PENDING);
    }

    public LeaveRequest approve(Long id) {
        LeaveRequest leaveRequest = leaveRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Solicitacao nao encontrada."));

        ensureCanDecide(leaveRequest);

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Somente solicitacoes pendentes podem ser aprovadas.");
        }

        boolean hasOverlap = leaveRepository
                .existsByEmployeeIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        leaveRequest.getEmployee().getId(),
                        LeaveStatus.APPROVED,
                        leaveRequest.getEndDate(),
                        leaveRequest.getStartDate());

        if (hasOverlap) {
            throw new IllegalArgumentException("Ja existe uma ausencia aprovada para este funcionario nesse periodo.");
        }

        leaveRequest.setStatus(LeaveStatus.APPROVED);
        leaveRequest.setApprovedBy(currentUsername());
        leaveRequest.setApprovedAt(LocalDateTime.now());
        leaveRequest.setRejectedBy(null);
        leaveRequest.setRejectedAt(null);
        leaveRequest.setRejectionReason(null);
        return leaveRepository.save(leaveRequest);
    }

    public LeaveRequest reject(Long id) {
        return reject(id, null);
    }

    public LeaveRequest reject(Long id, String reason) {
        LeaveRequest leaveRequest = leaveRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Solicitacao nao encontrada."));

        ensureCanDecide(leaveRequest);

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Somente solicitacoes pendentes podem ser rejeitadas.");
        }

        leaveRequest.setStatus(LeaveStatus.REJECTED);
        leaveRequest.setRejectedBy(currentUsername());
        leaveRequest.setRejectedAt(LocalDateTime.now());
        leaveRequest.setRejectionReason(reason == null || reason.isBlank() ? null : reason.trim());
        leaveRequest.setApprovedBy(null);
        leaveRequest.setApprovedAt(null);
        return leaveRepository.save(leaveRequest);
    }

    private void ensureCanDecide(LeaveRequest leaveRequest) {
        User user = currentUser();

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.HR) {
            return;
        }

        Employee employee = leaveRequest.getEmployee();
        Long managerId = employee != null && employee.getManager() != null ? employee.getManager().getId() : null;
        Long currentEmployeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;

        if (user.getRole() == Role.MANAGER && currentEmployeeId != null && currentEmployeeId.equals(managerId)) {
            return;
        }

        throw new AccessDeniedException("Acesso negado.");
    }

    private boolean canAccessEmployee(User user, Long employeeId) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.HR) {
            return true;
        }

        Long currentEmployeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        if (currentEmployeeId == null) {
            return false;
        }

        if (currentEmployeeId.equals(employeeId)) {
            return true;
        }

        return user.getRole() == Role.MANAGER
                && employeeRepository.findById(employeeId)
                        .map(employee -> employee.getManager() != null
                                && currentEmployeeId.equals(employee.getManager().getId()))
                        .orElse(false);
    }

    private User currentUser() {
        return userRepository.findByUsername(currentUsername())
                .orElseThrow(() -> new AccessDeniedException("Acesso negado."));
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "system";
        }
        return authentication.getName();
    }
}
