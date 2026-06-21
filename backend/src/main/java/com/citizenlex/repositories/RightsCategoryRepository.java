package com.citizenlex.repositories;

import com.citizenlex.entities.RightsCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RightsCategoryRepository extends JpaRepository<RightsCategory, Long> {
    Optional<RightsCategory> findByName(String name);
}
