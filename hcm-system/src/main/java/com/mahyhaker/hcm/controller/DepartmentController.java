package com.mahyhaker.hcm.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.model.Department;
import com.mahyhaker.hcm.repository.DepartmentRepository;
import com.mahyhaker.hcm.repository.EmployeeRepository;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentRepository repository;
    private final EmployeeRepository employeeRepository;

    public DepartmentController(DepartmentRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Department create(@RequestBody Department department) {
        return repository.save(department);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @GetMapping
    public List<Department> getAll() {
        return repository.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        boolean hasEmployees = employeeRepository.findAll()
                .stream()
                .anyMatch(emp -> emp.getDepartment() != null && emp.getDepartment().getId().equals(id));

        if (hasEmployees) {
            throw new IllegalStateException("Não é possível deletar o departamento porque existem funcionários vinculados a ele.");
        }

        repository.deleteById(id);
    }
}