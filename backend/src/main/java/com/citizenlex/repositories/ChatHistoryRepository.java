package com.citizenlex.repositories;

import com.citizenlex.entities.ChatHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<ChatHistory> findByUserId(Long userId, Pageable pageable);
    
    long countByUserId(Long userId);
}
