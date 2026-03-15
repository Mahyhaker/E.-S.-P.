package com.mahyhaker.hcm.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.dto.CreateEmployeeWithUserRequest;
import com.mahyhaker.hcm.dto.EmployeeTreeNode;
import com.mahyhaker.hcm.dto.EmployeeWithUserResponse;
import com.mahyhaker.hcm.model.Department;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.DepartmentRepository;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.UserRepository;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public EmployeeWithUserResponse createEmployeeWithUser(CreateEmployeeWithUserRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }

        if (request.getPosition() == null || request.getPosition().isBlank()) {
            throw new IllegalArgumentException("Cargo é obrigatório.");
        }

        if (request.getSalary() == null || request.getSalary() <= 0) {
            throw new IllegalArgumentException("Salário deve ser maior que zero.");
        }

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username é obrigatório.");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password é obrigatória.");
        }

        if (request.getRole() == null || request.getRole().isBlank()) {
            throw new IllegalArgumentException("Role é obrigatória.");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Já existe um usuário com esse username.");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Role inválida.");
        }

        Employee employee = new Employee();
        employee.setName(request.getName());
        employee.setPosition(request.getPosition());
        employee.setSalary(request.getSalary());
        employee.setPernr(generatePernr());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Departamento não encontrado."));
            employee.setDepartment(department);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository
                    .findById(request.getManagerId())
                    .orElseThrow(() -> new IllegalArgumentException("Gerente não encontrado."));
            employee.setManager(manager);
        }

        Employee savedEmployee = employeeRepository.save(employee);

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setActive(request.getActive() == null ? true : request.getActive());
        user.setEmployee(savedEmployee);

        User savedUser = userRepository.save(user);

        return new EmployeeWithUserResponse(
                savedEmployee.getId(),
                savedEmployee.getName(),
                savedEmployee.getPernr(),
                savedUser.getUsername(),
                savedUser.getRole().name()
        );
    }

    public List<EmployeeTreeNode> getOrganizationTree() {
        List<Employee> employees = employeeRepository.findAll();

        Map<Long, EmployeeTreeNode> nodeMap = new HashMap<>();
        List<EmployeeTreeNode> roots = new ArrayList<>();

        for (Employee emp : employees) {
            String departmentName = emp.getDepartment() != null
                    ? emp.getDepartment().getName()
                    : "";

            EmployeeTreeNode node = new EmployeeTreeNode(
                    emp.getId(),
                    emp.getName(),
                    emp.getPernr(),
                    emp.getPosition(),
                    departmentName
            );

            nodeMap.put(emp.getId(), node);
        }

        for (Employee emp : employees) {
            EmployeeTreeNode node = nodeMap.get(emp.getId());

            if (emp.getManager() != null && emp.getManager().getId() != null) {
                EmployeeTreeNode managerNode = nodeMap.get(emp.getManager().getId());

                if (managerNode != null) {
                    managerNode.getChildren().add(node);
                } else {
                    roots.add(node);
                }
            } else {
                roots.add(node);
            }
        }

        return roots;
    }

    private String generatePernr() {
        return employeeRepository.findTopByOrderByIdDesc()
                .map(emp -> {
                    int next = Integer.parseInt(emp.getPernr()) + 1;
                    return String.format("%08d", next);
                })
                .orElse("00000001");
    }
}