package com.mahyhaker.hcm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mahyhaker.hcm.model.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findTopByOrderByIdDesc();

    List<Employee> findByManagerId(Long managerId);

    @Query("""
            select distinct e from Employee e
            left join e.department d
            where (:search is null
                or lower(e.name) like lower(concat('%', :search, '%'))
                or lower(e.pernr) like lower(concat('%', :search, '%'))
                or lower(e.position) like lower(concat('%', :search, '%')))
            and (:departmentId is null or d.id = :departmentId)
            order by e.name
            """)
    List<Employee> search(@Param("search") String search, @Param("departmentId") Long departmentId);
}
