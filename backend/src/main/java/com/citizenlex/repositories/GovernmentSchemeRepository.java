package com.citizenlex.repositories;

import com.citizenlex.entities.GovernmentScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GovernmentSchemeRepository extends JpaRepository<GovernmentScheme, Long> {
    List<GovernmentScheme> findByCategoryIgnoreCase(String category);
    
    List<GovernmentScheme> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrEligibilityContainingIgnoreCase(
            String title, String category, String eligibility);
}
