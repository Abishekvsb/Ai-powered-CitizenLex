package com.citizenlex.repositories;

import com.citizenlex.entities.RightsContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RightsContentRepository extends JpaRepository<RightsContent, Long> {
    List<RightsContent> findByCategoryId(Long categoryId);
    
    List<RightsContent> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrTamilTitleContainingIgnoreCaseOrTamilContentContainingIgnoreCase(
            String title, String content, String tamilTitle, String tamilContent);
}
