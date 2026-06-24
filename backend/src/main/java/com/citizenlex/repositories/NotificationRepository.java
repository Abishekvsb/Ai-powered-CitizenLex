package com.citizenlex.repositories;

import com.citizenlex.entities.Notification;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Fetch notifications for a user (both user-specific and global ones)
    @Query("SELECT n FROM Notification n WHERE n.user = :user OR n.user IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findByUserOrGlobal(@Param("user") User user);

    // Count unread notifications for a user (user-specific + global)
    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.user = :user OR n.user IS NULL) AND n.isRead = false")
    long countUnreadByUserOrGlobal(@Param("user") User user);

    // For seeder - count global notifications only
    long countByUserIsNull();
}
