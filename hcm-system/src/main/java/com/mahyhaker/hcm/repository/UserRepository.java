package com.mahyhaker.hcm.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmployeeId(Long employeeId);
}
