package com.mahyhaker.hcm.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.dto.CurrentUserResponse;
import com.mahyhaker.hcm.dto.UpdateUserRequest;
import com.mahyhaker.hcm.dto.UserResponse;
import com.mahyhaker.hcm.exception.NotFoundException;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CurrentUserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));
        Employee employee = user.getEmployee();

        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.isActive(),
                employee != null ? employee.getId() : null,
                employee != null ? employee.getName() : null,
                employee != null ? employee.getPosition() : null,
                employee != null && employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                employee != null && employee.getManager() != null ? employee.getManager().getName() : null
        );
    }

    public void updateOwnPassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Usuario nao encontrado."));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Senha atual invalida.");
        }

        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 6) {
            throw new IllegalArgumentException("Nova senha deve ter pelo menos 6 caracteres.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserResponse updateByEmployeeId(Long employeeId, UpdateUserRequest request) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("Usuario nao encontrado para este funcionario."));

        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Role inválida.");
            }
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.isActive(),
                user.getEmployee() != null ? user.getEmployee().getId() : null
        );
    }
}
