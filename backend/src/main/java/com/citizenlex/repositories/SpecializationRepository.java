package com.citizenlex.repositories;

import com.citizenlex.entities.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SpecializationRepository extends JpaRepository<Specialization, Long> {
    Optional<Specialization> findByName(String name);
}
