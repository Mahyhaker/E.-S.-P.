package com.mahyhaker.hcm.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.dto.DashboardSummary;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.LeaveRequest;
import com.mahyhaker.hcm.model.LeaveStatus;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.DepartmentRepository;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.LeaveRepository;
import com.mahyhaker.hcm.repository.UserRepository;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;

    public DashboardService(EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            LeaveRepository leaveRepository,
                            UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
    }

    public DashboardSummary getSummary(String username) {
        User user = userRepository.findByUsername(username).orElse(null);

        if (user != null && user.getRole() == Role.MANAGER) {
            return getManagerSummary(user.getEmployee());
        }

        if (user != null && user.getRole() == Role.EMPLOYEE) {
            return getEmployeeSummary(user.getEmployee());
        }

        return getAdminSummary();
    }

    private DashboardSummary getAdminSummary() {
        List<Employee> employees = employeeRepository.findAll();
        List<LeaveRequest> leaveRequests = leaveRepository.findAll();
        LocalDate today = LocalDate.now();

        long totalManagers = employees.stream()
                .filter(employee -> employees.stream()
                        .anyMatch(other -> other.getManager() != null
                                && other.getManager().getId().equals(employee.getId())))
                .count();

        return new DashboardSummary(
                employees.size(),
                departmentRepository.count(),
                totalManagers,
                employees.stream().filter(employee -> employee.getManager() == null).count(),
                employees.stream().filter(employee -> employee.getDepartment() == null).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.PENDING).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.APPROVED).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.REJECTED).count(),
                leaveRequests.stream()
                        .filter(request -> request.getStartDate() != null && !request.getStartDate().isBefore(today))
                        .sorted(Comparator.comparing(LeaveRequest::getStartDate))
                        .limit(5)
                        .toList()
        );
    }

    private DashboardSummary getManagerSummary(Employee manager) {
        if (manager == null || manager.getId() == null) {
            return emptySummary();
        }

        List<Employee> team = employeeRepository.findByManagerId(manager.getId());
        List<Long> teamIds = team.stream().map(Employee::getId).toList();
        List<LeaveRequest> teamRequests = leaveRepository.findAll()
                .stream()
                .filter(request -> request.getEmployee() != null && teamIds.contains(request.getEmployee().getId()))
                .toList();

        return buildScopedSummary(team, teamRequests);
    }

    private DashboardSummary getEmployeeSummary(Employee employee) {
        if (employee == null || employee.getId() == null) {
            return emptySummary();
        }

        List<LeaveRequest> ownRequests = leaveRepository.findByEmployeeIdOrderByStartDateDesc(employee.getId());
        return buildScopedSummary(List.of(employee), ownRequests);
    }

    private DashboardSummary buildScopedSummary(List<Employee> employees, List<LeaveRequest> leaveRequests) {
        LocalDate today = LocalDate.now();

        return new DashboardSummary(
                employees.size(),
                employees.stream()
                        .filter(employee -> employee.getDepartment() != null)
                        .map(employee -> employee.getDepartment().getId())
                        .distinct()
                        .count(),
                employees.stream()
                        .filter(employee -> employees.stream()
                                .anyMatch(other -> other.getManager() != null
                                        && other.getManager().getId().equals(employee.getId())))
                        .count(),
                employees.stream().filter(employee -> employee.getManager() == null).count(),
                employees.stream().filter(employee -> employee.getDepartment() == null).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.PENDING).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.APPROVED).count(),
                leaveRequests.stream().filter(request -> request.getStatus() == LeaveStatus.REJECTED).count(),
                leaveRequests.stream()
                        .filter(request -> request.getStartDate() != null && !request.getStartDate().isBefore(today))
                        .sorted(Comparator.comparing(LeaveRequest::getStartDate))
                        .limit(5)
                        .toList()
        );
    }

    private DashboardSummary emptySummary() {
        return new DashboardSummary(0, 0, 0, 0, 0, 0, 0, 0, List.of());
    }
}
