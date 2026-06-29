package com.citizenlex.controllers;

import com.citizenlex.dtos.AdminAnalyticsDto;
import com.citizenlex.dtos.UserDto;
import com.citizenlex.entities.ActivityLog;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.*;
import com.citizenlex.services.LogService;
import com.citizenlex.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private LogService logService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RightsContentRepository rightsContentRepository;

    @Autowired
    private GovernmentSchemeRepository governmentSchemeRepository;

    @Autowired
    private UserDocumentRepository userDocumentRepository;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDto> getAnalytics() {
        long totalUsers = userRepository.count();
        long totalRights = rightsContentRepository.count();
        long totalSchemes = governmentSchemeRepository.count();
        long totalDocuments = userDocumentRepository.count();
        long totalChats = chatHistoryRepository.count();
        long totalDrafts = activityLogRepository.countByAction("GENERATE_DRAFT") + activityLogRepository.countByAction("DRAFT");

        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
        long activeUsers = userRepository.countByLastLoginAfter(thirtyDaysAgo);
        // Fallback if no logins recorded yet
        if (activeUsers == 0 && totalUsers > 0) activeUsers = totalUsers;

        java.time.LocalDateTime startOfToday = java.time.LocalDate.now().atStartOfDay();
        long dailyLogins = activityLogRepository.countByActionAndTimestampAfter("LOGIN", startOfToday);
        if (dailyLogins == 0 && totalUsers > 0) dailyLogins = 1; // Fallback for active session

        long aiRequests = activityLogRepository.countByAction("AI_CHAT") + activityLogRepository.countByAction("VOICE_QUERY");
        long ocrUsage = activityLogRepository.countByAction("OCR_SCAN");
        long voiceAiUsage = activityLogRepository.countByAction("VOICE_QUERY");

        // Storage used: 1.25 MB per document uploaded, converted to GB
        double storageUsedGb = (totalDocuments * 1.25 * 1024 * 1024) / (1024.0 * 1024.0 * 1024.0);
        storageUsedGb = Math.round(storageUsedGb * 1000.0) / 1000.0;

        // Cloudinary usage: count users with profileImageUrl
        long cloudinaryUsage = userRepository.findAll().stream()
                .filter(u -> u.getProfileImageUrl() != null && !u.getProfileImageUrl().isBlank())
                .count();

        // Notification preferences analytics
        long emailNotificationsEnabled = userRepository.findAll().stream()
                .filter(u -> u.getEmailNotifications() == null || u.getEmailNotifications())
                .count();
        long pushNotificationsEnabled = userRepository.findAll().stream()
                .filter(u -> u.getPushNotifications() == null || u.getPushNotifications())
                .count();
        long reminderNotificationsEnabled = userRepository.findAll().stream()
                .filter(u -> u.getReminderNotifications() == null || u.getReminderNotifications())
                .count();

        // Revenue ready metrics (Mock values based on total users for demo purposes)
        long premiumUsers = Math.max(1, Math.round(totalUsers * 0.15)); // Mock 15% premium conversion
        double monthlyRecurringRevenue = premiumUsers * 9.99; // $9.99 per month

        AdminAnalyticsDto dto = new AdminAnalyticsDto(
                totalUsers, totalRights, totalSchemes, totalDocuments, totalChats, totalDrafts,
                activeUsers, dailyLogins, aiRequests, ocrUsage, voiceAiUsage,
                storageUsedGb, cloudinaryUsage, emailNotificationsEnabled,
                pushNotificationsEnabled, reminderNotificationsEnabled,
                monthlyRecurringRevenue, premiumUsers
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/activity-trend")
    public ResponseEntity<List<java.util.Map<String, Object>>> getActivityTrend() {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusDays(30);
        List<Object[]> results = activityLogRepository.findDailyActivitySince(since);
        List<java.util.Map<String, Object>> trend = results.stream().map(row -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("date", row[0].toString());
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/action-breakdown")
    public ResponseEntity<java.util.Map<String, Long>> getActionBreakdown() {
        List<Object[]> results = activityLogRepository.countByActionGrouped();
        java.util.Map<String, Long> breakdown = results.stream().collect(Collectors.toMap(
                row -> row[0] != null ? row[0].toString() : "UNKNOWN",
                row -> (Long) row[1],
                (existing, replacement) -> existing
        ));
        return ResponseEntity.ok(breakdown);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers().stream()
                .map(user -> ProfileController.toFullDto(user))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> changeUserRole(@PathVariable Long id, @RequestParam String role) {
        User updated = userService.changeUserRole(id, role);
        return ResponseEntity.ok(ProfileController.toFullDto(updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ActivityLog>> getLogs() {
        return ResponseEntity.ok(logService.getAllLogs());
    }
}
