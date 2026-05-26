package com.mahyhaker.hcm.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import com.mahyhaker.hcm.dto.PersonalDataResponse;
import com.mahyhaker.hcm.dto.UpdatePersonalDataRequest;
import com.mahyhaker.hcm.model.Employee;
import com.mahyhaker.hcm.model.Role;
import com.mahyhaker.hcm.model.User;
import com.mahyhaker.hcm.repository.EmployeeRepository;
import com.mahyhaker.hcm.repository.PersonalDataRepository;
import com.mahyhaker.hcm.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PersonalDataServiceTests {

    @Mock
    private PersonalDataRepository personalDataRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PersonalDataService service;

    private User hrUser;

    @BeforeEach
    void setUp() {
        Employee employee = new Employee();
        ReflectionTestUtils.setField(employee, "id", 1L);

        hrUser = new User();
        hrUser.setUsername("rh");
        hrUser.setRole(Role.HR);
        hrUser.setEmployee(employee);
    }

    @Test
    void hrRequiresSetupWithoutPersonalData() {
        when(personalDataRepository.findByEmployeeId(1L)).thenReturn(Optional.empty());

        assertTrue(service.requiresSetup(hrUser));
    }

    @Test
    void hrCanSaveOwnPersonalData() {
        UpdatePersonalDataRequest request = new UpdatePersonalDataRequest();
        request.setFullName("Maria Silva");
        request.setCpf("529.982.247-25");
        request.setRg("12.345.678-9");
        request.setPhone("(11) 98765-4321");

        when(userRepository.findByUsername("rh")).thenReturn(Optional.of(hrUser));
        when(personalDataRepository.findByEmployeeId(1L)).thenReturn(Optional.empty());
        when(personalDataRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PersonalDataResponse response = service.saveOwn("rh", request);

        assertTrue(response.isComplete());
        assertEquals("52998224725", response.getCpf());
        assertEquals("11987654321", response.getPhone());
    }

    @Test
    void nonHrCannotReadPersonalData() {
        User manager = new User();
        manager.setUsername("manager");
        manager.setRole(Role.MANAGER);
        when(userRepository.findByUsername("manager")).thenReturn(Optional.of(manager));

        assertThrows(AccessDeniedException.class, () -> service.getForEmployee(1L, "manager"));
    }
}
