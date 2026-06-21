package com.citizenlex.repositories;

import com.citizenlex.entities.UserDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDocumentRepository extends JpaRepository<UserDocument, Long> {
    List<UserDocument> findByUserIdOrderByUploadedAtDesc(Long userId);
    
    long countByUserId(Long userId);
}
