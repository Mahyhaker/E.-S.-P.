package com.mahyhaker.hcm.service;

import java.time.LocalDateTime;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahyhaker.hcm.dto.PersonalDataResponse;
import com.mahyhaker.hcm.dto.UpdatePersonalDataRequest;
import com.mahyhaker.hcm.exception.NotFoundException;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.PersonalData;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.PersonalDataRepository;
import com.mahyhaker.hcm.repository.UserRepository;

@Service
public class PersonalDataService {

    private final PersonalDataRepository personalDataRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public PersonalDataService(PersonalDataRepository personalDataRepository,
                               EmployeeRepository employeeRepository,
                               UserRepository userRepository) {
        this.personalDataRepository = personalDataRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    public boolean requiresSetup(User user) {
        if (user == null || user.getRole() != Role.HR) {
            return false;
        }

        if (user.getEmployee() == null || user.getEmployee().getId() == null) {
            return true;
        }

        return personalDataRepository.findByEmployeeId(user.getEmployee().getId())
                .map(data -> !isComplete(data))
                .orElse(true);
    }

    public PersonalDataResponse getOwn(String username) {
        User user = requireHr(username);
        Employee employee = requireLinkedEmployee(user);
        return toResponse(employee.getId(), personalDataRepository.findByEmployeeId(employee.getId()).orElse(null));
    }

    public PersonalDataResponse getForEmployee(Long employeeId, String username) {
        requireHr(username);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Funcionario nao encontrado."));
        return toResponse(employee.getId(), personalDataRepository.findByEmployeeId(employeeId).orElse(null));
    }

    @Transactional
    public PersonalDataResponse saveOwn(String username, UpdatePersonalDataRequest request) {
        User user = requireHr(username);
        return save(user, requireLinkedEmployee(user), request);
    }

    @Transactional
    public PersonalDataResponse saveForEmployee(Long employeeId, String username, UpdatePersonalDataRequest request) {
        User user = requireHr(username);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Funcionario nao encontrado."));
        return save(user, employee, request);
    }

    private PersonalDataResponse save(User user, Employee employee, UpdatePersonalDataRequest request) {
        String cpf = digitsOnly(request.getCpf());
        String phone = digitsOnly(request.getPhone());
        String rg = request.getRg().trim();
        String fullName = request.getFullName().trim();

        if (!isValidCpf(cpf)) {
            throw new IllegalArgumentException("CPF invalido.");
        }

        if (rg.length() < 5) {
            throw new IllegalArgumentException("RG invalido.");
        }

        if (phone.length() < 10 || phone.length() > 11) {
            throw new IllegalArgumentException("Telefone deve conter DDD e numero.");
        }

        if (personalDataRepository.existsByCpfAndEmployeeIdNot(cpf, employee.getId())) {
            throw new IllegalArgumentException("CPF ja cadastrado para outro funcionario.");
        }

        PersonalData data = personalDataRepository.findByEmployeeId(employee.getId()).orElseGet(PersonalData::new);
        data.setEmployee(employee);
        data.setFullName(fullName);
        data.setCpf(cpf);
        data.setRg(rg);
        data.setPhone(phone);
        data.setUpdatedAt(LocalDateTime.now());
        data.setUpdatedBy(user.getUsername());

        return toResponse(employee.getId(), personalDataRepository.save(data));
    }

    private User requireHr(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("Acesso negado."));

        if (user.getRole() != Role.HR) {
            throw new AccessDeniedException("Dados pessoais sao restritos ao RH.");
        }

        return user;
    }

    private Employee requireLinkedEmployee(User user) {
        if (user.getEmployee() == null || user.getEmployee().getId() == null) {
            throw new IllegalStateException("Usuario do RH precisa estar vinculado a um funcionario.");
        }

        return user.getEmployee();
    }

    private PersonalDataResponse toResponse(Long employeeId, PersonalData data) {
        return new PersonalDataResponse(
                employeeId,
                data != null ? data.getFullName() : null,
                data != null ? data.getCpf() : null,
                data != null ? data.getRg() : null,
                data != null ? data.getPhone() : null,
                data != null && isComplete(data),
                data != null ? data.getUpdatedAt() : null,
                data != null ? data.getUpdatedBy() : null
        );
    }

    private boolean isComplete(PersonalData data) {
        return hasText(data.getFullName())
                && hasText(data.getCpf())
                && hasText(data.getRg())
                && hasText(data.getPhone());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String digitsOnly(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private boolean isValidCpf(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateCpfDigit(cpf, 9, 10);
        int secondDigit = calculateCpfDigit(cpf, 10, 11);
        return firstDigit == Character.getNumericValue(cpf.charAt(9))
                && secondDigit == Character.getNumericValue(cpf.charAt(10));
    }

    private int calculateCpfDigit(String cpf, int length, int initialWeight) {
        int sum = 0;
        for (int index = 0; index < length; index++) {
            sum += Character.getNumericValue(cpf.charAt(index)) * (initialWeight - index);
        }

        int remainder = 11 - (sum % 11);
        return remainder >= 10 ? 0 : remainder;
    }
}
