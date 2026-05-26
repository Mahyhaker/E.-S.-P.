package com.mahyhaker.hcm.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mahyhaker.hcm.model.PersonalData;

public interface PersonalDataRepository extends JpaRepository<PersonalData, Long> {

    Optional<PersonalData> findByEmployeeId(Long employeeId);

    boolean existsByCpfAndEmployeeIdNot(String cpf, Long employeeId);

    void deleteByEmployeeId(Long employeeId);
}
