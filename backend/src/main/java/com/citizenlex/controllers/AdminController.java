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
        AdminAnalyticsDto dto = new AdminAnalyticsDto(
                userRepository.count(),
                rightsContentRepository.count(),
                governmentSchemeRepository.count(),
                userDocumentRepository.count(),
                chatHistoryRepository.count(),
                activityLogRepository.countByAction("DRAFT")
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
