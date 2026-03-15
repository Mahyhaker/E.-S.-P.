package com.mahyhaker.hcm.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("123"));
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
            }
        };
    }
}