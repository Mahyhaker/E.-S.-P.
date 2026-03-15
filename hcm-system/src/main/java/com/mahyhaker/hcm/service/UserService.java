package com.mahyhaker.hcm.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mahyhaker.hcm.dto.UpdateUserRequest;
import com.mahyhaker.hcm.dto.UserResponse;
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

    public UserResponse updateByEmployeeId(Long employeeId, UpdateUserRequest request) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para este funcionário."));

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