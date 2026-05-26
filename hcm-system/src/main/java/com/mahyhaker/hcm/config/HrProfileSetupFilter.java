package com.mahyhaker.hcm.config;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.mahyhaker.hcm.repository.UserRepository;
import com.mahyhaker.hcm.service.PersonalDataService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class HrProfileSetupFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final PersonalDataService personalDataService;

    public HrProfileSetupFilter(UserRepository userRepository, PersonalDataService personalDataService) {
        this.userRepository = userRepository;
        this.personalDataService = personalDataService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && !isSetupEndpoint(request.getRequestURI())
                && userRepository.findByUsername(authentication.getName())
                        .map(personalDataService::requiresSetup)
                        .orElse(false)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Complete seu cadastro pessoal antes de continuar.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSetupEndpoint(String path) {
        return path.equals("/personal-data/me")
                || path.equals("/users/me")
                || path.startsWith("/auth/")
                || path.equals("/error");
    }
}
