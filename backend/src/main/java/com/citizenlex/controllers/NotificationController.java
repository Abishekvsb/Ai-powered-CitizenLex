package com.citizenlex.controllers;

import com.citizenlex.entities.Notification;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.NotificationRepository;
import com.citizenlex.repositories.UserRepository;
import com.citizenlex.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal) {
            return userRepository.findById(((UserPrincipal) principal).getId()).orElse(null);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Notification> notifications = notificationRepository.findByUserOrGlobal(user);
        long unreadCount = notificationRepository.countUnreadByUserOrGlobal(user);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        long count = notificationRepository.countUnreadByUserOrGlobal(user);
        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isPresent()) {
            Notification notif = notifOpt.get();
            // Only allow marking if it belongs to this user or is global
            if (notif.getUser() == null || notif.getUser().getId().equals(user.getId())) {
                notif.setIsRead(true);
                notificationRepository.save(notif);
                return ResponseEntity.ok(Map.of("success", true));
            }
        }
        return ResponseEntity.status(404).body("Notification not found");
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Notification> notifications = notificationRepository.findByUserOrGlobal(user);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok(Map.of("success", true, "marked", notifications.size()));
    }
}
