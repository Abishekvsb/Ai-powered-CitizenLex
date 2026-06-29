package com.citizenlex.repositories;

import com.citizenlex.entities.ActivityLog;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findAllByOrderByTimestampDesc();

    List<ActivityLog> findByUserOrderByTimestampDesc(User user);

    List<ActivityLog> findByUserAndTimestampBetweenOrderByTimestampDesc(User user, LocalDateTime start, LocalDateTime end);

    // Count actions by type
    long countByAction(String action);

    long countByUserAndAction(User user, String action);

    // Get activity grouped by date for trend chart (last 30 days)
    @Query("SELECT CAST(a.timestamp AS date), COUNT(a) FROM ActivityLog a " +
           "WHERE a.timestamp >= :since GROUP BY CAST(a.timestamp AS date) ORDER BY CAST(a.timestamp AS date) ASC")
    List<Object[]> findDailyActivitySince(LocalDateTime since);

    // Count by action in date range
    @Query("SELECT a.action, COUNT(a) FROM ActivityLog a GROUP BY a.action")
    List<Object[]> countByActionGrouped();

    long countByActionAndTimestampAfter(String action, java.time.LocalDateTime since);
}
