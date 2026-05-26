package com.mahyhaker.hcm.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initUsers(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                @Value("${app.bootstrap-admin.username}") String adminUsername,
                                @Value("${app.bootstrap-admin.password}") String adminPassword) {
        return args -> {
            if (userRepository.findByUsername(adminUsername).isEmpty()) {
                if (adminPassword == null
                        || adminPassword.isBlank()
                        || adminPassword.length() < 8
                        || adminPassword.startsWith("change-this")) {
                    throw new IllegalStateException(
                            "Configure APP_ADMIN_INITIAL_PASSWORD com pelo menos 8 caracteres para criar o admin inicial."
                    );
                }

                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
            }
        };
    }
}
