package com.mahyhaker.hcm.controller;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahyhaker.hcm.dto.LoginRequest;
import com.mahyhaker.hcm.dto.LoginResponse;
import com.mahyhaker.hcm.exception.UnauthorizedException;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.UserRepository;
import com.mahyhaker.hcm.service.JwtService;
import com.mahyhaker.hcm.service.PersonalDataService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PersonalDataService personalDataService;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          JwtService jwtService,
                          PersonalDataService personalDataService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.personalDataService = personalDataService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException | DisabledException ex) {
            throw new UnauthorizedException("Usuário ou senha inválidos.");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado."));

        Long employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole().name(),
                employeeId
        );

        return new LoginResponse(
                token,
                user.getUsername(),
                user.getRole().name(),
                employeeId,
                personalDataService.requiresSetup(user)
        );
    }
}
