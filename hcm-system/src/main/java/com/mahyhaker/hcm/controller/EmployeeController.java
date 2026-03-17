package com.mahyhaker.hcm.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.dto.CreateEmployeeWithUserRequest;
import com.mahyhaker.hcm.dto.EmployeeWithUserResponse;
import com.mahyhaker.hcm.model.Department;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.repository.DepartmentRepository;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.service.EmployeeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeRepository repository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeService service;

    public EmployeeController(EmployeeRepository repository,
                              DepartmentRepository departmentRepository,
                              EmployeeService service) {
        this.repository = repository;
        this.departmentRepository = departmentRepository;
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @GetMapping
    public List<Employee> getAll() {
        return repository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @GetMapping("/{id}")
    public Employee getById(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/with-user")
    public EmployeeWithUserResponse createWithUser(@RequestBody CreateEmployeeWithUserRequest request) {
        return service.createEmployeeWithUser(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @PutMapping("/{id}")
    public Employee update(@PathVariable Long id, @Valid @RequestBody Employee employee) {
        Employee existing = repository.findById(id).orElseThrow();

        existing.setName(employee.getName());
        existing.setPosition(employee.getPosition());
        existing.setSalary(employee.getSalary());

        if (employee.getDepartment() != null) {
            Department department = departmentRepository
                    .findById(employee.getDepartment().getId())
                    .orElseThrow();
            existing.setDepartment(department);
        } else {
            existing.setDepartment(null);
        }

        if (employee.getManager() != null) {
            Employee manager = repository.findById(employee.getManager().getId()).orElseThrow();

            if (manager.getId().equals(id)) {
                throw new IllegalArgumentException("Um funcionário não pode ser gerente de si mesmo.");
            }

            if (manager.getManager() != null && manager.getManager().getId().equals(id)) {
                throw new IllegalArgumentException("Ciclo de gerência não permitido.");
            }

            existing.setManager(manager);
        } else {
            existing.setManager(null);
        }

        return repository.save(existing);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteEmployee(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    @GetMapping("/tree")
    public List<com.mahyhaker.hcm.dto.EmployeeTreeNode> getTree() {
        return service.getOrganizationTree();
    }
}