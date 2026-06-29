package com.citizenlex.controllers;

import com.citizenlex.entities.ActivityLog;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.ActivityLogRepository;
import com.citizenlex.repositories.UserSessionRepository;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final DateTimeFormatter CSV_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired private UserService userService;
    @Autowired private ActivityLogRepository activityLogRepository;
    @Autowired private UserSessionRepository userSessionRepository;

    /** GET /api/stats/summary — Dashboard stat counts and login streak info. */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<ActivityLog> logs = activityLogRepository.findByUserOrderByTimestampDesc(user);

        long aiChats = count(logs, "AI_CHAT");
        long ocrScans = count(logs, "OCR_SCAN");
        long voiceQueries = count(logs, "VOICE_QUERY");
        long drafts = count(logs, "GENERATE_DRAFT");
        long rightsViewed = count(logs, "VIEW_RIGHT");
        long schemesViewed = count(logs, "VIEW_SCHEME");
        long documents = count(logs, "UPLOAD_DOCUMENT");
        long bookmarks = count(logs, "ADD_BOOKMARK");
        long totalLogins = count(logs, "LOGIN");
        long activeSessions = userSessionRepository.countByUserAndRevokedFalse(user);

        // Profile completion score
        int completion = calculateCompletion(user);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("aiChats", aiChats);
        summary.put("ocrScans", ocrScans);
        summary.put("voiceQueries", voiceQueries);
        summary.put("drafts", drafts);
        summary.put("rightsViewed", rightsViewed);
        summary.put("schemesViewed", schemesViewed);
        summary.put("documents", documents);
        summary.put("bookmarks", bookmarks);
        summary.put("totalLogins", totalLogins);
        summary.put("activeSessions", activeSessions);
        summary.put("profileCompletion", completion);
        summary.put("memberSince", user.getCreatedAt() != null ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy")) : "N/A");

        return ResponseEntity.ok(summary);
    }

    /** GET /api/stats/timeline?filter=today|week|month|all — Activity timeline. */
    @GetMapping("/timeline")
    public ResponseEntity<?> getTimeline(@RequestParam(defaultValue = "all") String filter) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<ActivityLog> logs;
        LocalDateTime now = LocalDateTime.now();

        switch (filter.toLowerCase()) {
            case "today" ->
                logs = activityLogRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(
                    user, now.toLocalDate().atStartOfDay(), now);
            case "week" ->
                logs = activityLogRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(
                    user, now.minusDays(7), now);
            case "month" ->
                logs = activityLogRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(
                    user, now.minusDays(30), now);
            default ->
                logs = activityLogRepository.findByUserOrderByTimestampDesc(user);
        }

        List<Map<String, Object>> timeline = logs.stream().map(log -> Map.<String, Object>of(
            "id", log.getId(),
            "action", log.getAction(),
            "details", log.getDetails() != null ? log.getDetails() : "",
            "timestamp", log.getTimestamp().format(FMT),
            "icon", getActionIcon(log.getAction()),
            "color", getActionColor(log.getAction())
        )).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("timeline", timeline, "total", timeline.size()));
    }

    /** GET /api/stats/achievements — Compute and return user achievement badges. */
    @GetMapping("/achievements")
    public ResponseEntity<?> getAchievements() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<ActivityLog> logs = activityLogRepository.findByUserOrderByTimestampDesc(user);

        List<Map<String, Object>> achievements = new ArrayList<>();
        achievements.add(badge("First Login", "🎉", "Logged in for the first time", count(logs, "LOGIN") >= 1, "#6366f1"));
        achievements.add(badge("Explorer", "🔍", "Viewed your first right or scheme", count(logs, "VIEW_RIGHT") + count(logs, "VIEW_SCHEME") >= 1, "#06b6d4"));
        achievements.add(badge("Rights Master", "⚖️", "Viewed 10+ rights articles", count(logs, "VIEW_RIGHT") >= 10, "#8b5cf6"));
        achievements.add(badge("Scheme Finder", "📋", "Explored 5+ government schemes", count(logs, "VIEW_SCHEME") >= 5, "#10b981"));
        achievements.add(badge("AI Expert", "🤖", "Used the AI Legal Copilot 5+ times", count(logs, "AI_CHAT") >= 5, "#f59e0b"));
        achievements.add(badge("OCR User", "📷", "Scanned a document with OCR", count(logs, "OCR_SCAN") >= 1, "#ef4444"));
        achievements.add(badge("Voice AI User", "🎤", "Used Voice AI feature", count(logs, "VOICE_QUERY") >= 1, "#ec4899"));
        achievements.add(badge("Document Creator", "📄", "Generated a legal draft", count(logs, "GENERATE_DRAFT") >= 1, "#3b82f6"));
        achievements.add(badge("Power User", "⚡", "Completed 50+ activities", logs.size() >= 50, "#f97316"));
        achievements.add(badge("Daily User", "📅", "Logged in 7+ days", count(logs, "LOGIN") >= 7, "#14b8a6"));
        achievements.add(badge("Profile Complete", "✅", "Achieved 80%+ profile completion", calculateCompletion(user) >= 80, "#22c55e"));
        achievements.add(badge("Early Adopter", "🌟", "Joined CitizenLex", true, "#a855f7"));

        long unlocked = achievements.stream().filter(a -> Boolean.TRUE.equals(a.get("unlocked"))).count();
        return ResponseEntity.ok(Map.of("achievements", achievements, "totalUnlocked", unlocked, "total", achievements.size()));
    }

    /** PUT /api/stats/preferences — Update notification preferences. */
    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody Map<String, Object> body) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        Boolean emailNotif = getBool(body, "emailNotifications");
        Boolean pushNotif = getBool(body, "pushNotifications");
        Boolean reminderNotif = getBool(body, "reminderNotifications");
        Boolean marketingEmails = getBool(body, "marketingEmails");
        Boolean productUpdates = getBool(body, "productUpdates");

        User updated = userService.updateNotificationPreferences(user.getId(),
            emailNotif, pushNotif, reminderNotif, marketingEmails, productUpdates);
        return ResponseEntity.ok(ProfileController.toFullDto(updated));
    }

    /** GET /api/stats/download-data — Download user data as JSON. */
    @GetMapping("/download-data")
    public ResponseEntity<byte[]> downloadData() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).build();

        List<ActivityLog> logs = activityLogRepository.findByUserOrderByTimestampDesc(user);

        StringBuilder json = new StringBuilder("{\n");
        json.append("  \"profile\": {\n");
        json.append("    \"id\": ").append(user.getId()).append(",\n");
        json.append("    \"email\": \"").append(user.getEmail()).append("\",\n");
        json.append("    \"firstName\": \"").append(safe(user.getFirstName())).append("\",\n");
        json.append("    \"lastName\": \"").append(safe(user.getLastName())).append("\",\n");
        json.append("    \"mobile\": \"").append(safe(user.getMobile())).append("\",\n");
        json.append("    \"gender\": \"").append(safe(user.getGender())).append("\",\n");
        json.append("    \"state\": \"").append(safe(user.getState())).append("\",\n");
        json.append("    \"district\": \"").append(safe(user.getDistrict())).append("\",\n");
        json.append("    \"occupation\": \"").append(safe(user.getOccupation())).append("\",\n");
        json.append("    \"emailVerified\": ").append(Boolean.TRUE.equals(user.getEmailVerified())).append(",\n");
        json.append("    \"mobileVerified\": ").append(Boolean.TRUE.equals(user.getMobileVerified())).append(",\n");
        json.append("    \"memberSince\": \"").append(user.getCreatedAt()).append("\"\n");
        json.append("  },\n");
        json.append("  \"activityLog\": [\n");
        for (int i = 0; i < logs.size(); i++) {
            ActivityLog log = logs.get(i);
            json.append("    {\"action\": \"").append(log.getAction())
                .append("\", \"details\": \"").append(safe(log.getDetails()))
                .append("\", \"timestamp\": \"").append(log.getTimestamp()).append("\"}");
            if (i < logs.size() - 1) json.append(",");
            json.append("\n");
        }
        json.append("  ]\n}");

        byte[] bytes = json.toString().getBytes();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"citizenlex_data.json\"")
            .body(bytes);
    }

    /** GET /api/stats/export-activity — Export activity log as CSV. */
    @GetMapping("/export-activity")
    public ResponseEntity<byte[]> exportActivityCsv() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).build();

        List<ActivityLog> logs = activityLogRepository.findByUserOrderByTimestampDesc(user);
        StringBuilder csv = new StringBuilder("Action,Details,Timestamp\n");
        for (ActivityLog log : logs) {
            csv.append("\"").append(log.getAction()).append("\",");
            csv.append("\"").append(safe(log.getDetails())).append("\",");
            csv.append("\"").append(log.getTimestamp().format(CSV_FMT)).append("\"\n");
        }

        byte[] bytes = csv.toString().getBytes();
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"citizenlex_activity.csv\"")
            .body(bytes);
    }

    /** DELETE /api/stats/delete-account — Permanently delete user account. */
    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> body) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String password = body.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required to delete account."));
        }

        try {
            userService.deleteAccount(user.getId(), password);
            return ResponseEntity.ok(Map.of("message", "Account deleted permanently."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userService.findById(principal.getId());
    }

    private long count(List<ActivityLog> logs, String action) {
        return logs.stream().filter(l -> action.equals(l.getAction())).count();
    }

    private int calculateCompletion(User user) {
        int score = 0;
        if (user.getFirstName() != null && !user.getFirstName().isBlank()) score += 10;
        if (user.getLastName() != null && !user.getLastName().isBlank()) score += 10;
        if (user.getMobile() != null && !user.getMobile().isBlank()) score += 10;
        if (user.getDateOfBirth() != null) score += 10;
        if (user.getGender() != null && !user.getGender().isBlank()) score += 10;
        if (user.getState() != null && !user.getState().isBlank()) score += 10;
        if (user.getDistrict() != null && !user.getDistrict().isBlank()) score += 5;
        if (user.getAddress() != null && !user.getAddress().isBlank()) score += 5;
        if (user.getOccupation() != null && !user.getOccupation().isBlank()) score += 10;
        if (user.getPreferredLanguage() != null && !user.getPreferredLanguage().isBlank()) score += 5;
        if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isBlank()) score += 10;
        if (Boolean.TRUE.equals(user.getEmailVerified())) score += 5;
        return Math.min(100, score);
    }

    private Map<String, Object> badge(String name, String icon, String desc, boolean unlocked, String color) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", name);
        map.put("icon", icon);
        map.put("description", desc);
        map.put("unlocked", unlocked);
        map.put("color", color);
        return map;
    }

    private String getActionIcon(String action) {
        return switch (action) {
            case "LOGIN" -> "🔐";
            case "AI_CHAT" -> "🤖";
            case "OCR_SCAN" -> "📷";
            case "VOICE_QUERY" -> "🎤";
            case "GENERATE_DRAFT" -> "📝";
            case "VIEW_RIGHT" -> "⚖️";
            case "VIEW_SCHEME" -> "📋";
            case "ADD_BOOKMARK" -> "🔖";
            case "UPLOAD_DOCUMENT" -> "📄";
            case "UPDATE_PROFILE", "UPDATE_FULL_PROFILE" -> "👤";
            case "UPDATE_PROFILE_IMAGE" -> "📸";
            case "CHANGE_PASSWORD" -> "🔑";
            case "REGISTER" -> "🌟";
            default -> "📌";
        };
    }

    private String getActionColor(String action) {
        return switch (action) {
            case "LOGIN" -> "#6366f1";
            case "AI_CHAT" -> "#06b6d4";
            case "OCR_SCAN" -> "#f59e0b";
            case "VOICE_QUERY" -> "#ec4899";
            case "GENERATE_DRAFT" -> "#3b82f6";
            case "VIEW_RIGHT" -> "#10b981";
            case "VIEW_SCHEME" -> "#8b5cf6";
            case "ADD_BOOKMARK" -> "#ef4444";
            case "REGISTER" -> "#a855f7";
            default -> "#64748b";
        };
    }

    private String safe(String val) {
        if (val == null) return "";
        return val.replace("\"", "\\\"").replace("\n", " ");
    }

    private Boolean getBool(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val instanceof Boolean) return (Boolean) val;
        if (val instanceof String) return Boolean.parseBoolean((String) val);
        return null;
    }
}
