package com.citizenlex.repositories;

import com.citizenlex.entities.User;
import com.citizenlex.entities.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);

    List<UserSession> findByUserAndRevokedFalseOrderByLoginTimeDesc(User user);

    List<UserSession> findByUserOrderByLoginTimeDesc(User user);

    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.revoked = true WHERE s.user = :user AND s.revoked = false")
    int revokeAllSessions(User user);

    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.lastActive = CURRENT_TIMESTAMP WHERE s.sessionId = :sessionId")
    void updateLastActive(String sessionId);

    long countByUserAndRevokedFalse(User user);
}
