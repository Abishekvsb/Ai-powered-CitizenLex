package com.citizenlex.controllers;

import com.citizenlex.entities.User;
import com.citizenlex.entities.UserSession;
import com.citizenlex.repositories.UserSessionRepository;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private static final Logger logger = LoggerFactory.getLogger(SecurityController.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Autowired private UserService userService;
    @Autowired private UserSessionRepository userSessionRepository;

    /** GET /api/security/sessions — List all active sessions for the authenticated user. */
    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<UserSession> sessions = userSessionRepository.findByUserAndRevokedFalseOrderByLoginTimeDesc(user);
        List<Map<String, Object>> result = sessions.stream().map(s -> Map.<String, Object>of(
            "id", s.getId(),
            "sessionId", s.getSessionId(),
            "deviceInfo", s.getDeviceInfo() != null ? s.getDeviceInfo() : "Unknown Device",
            "ipAddress", s.getIpAddress() != null ? s.getIpAddress() : "Unknown",
            "loginTime", s.getLoginTime() != null ? s.getLoginTime().format(FMT) : "Unknown",
            "lastActive", s.getLastActive() != null ? s.getLastActive().format(FMT) : "Unknown"
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /** DELETE /api/security/sessions/{id} — Revoke a specific session. */
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        return userSessionRepository.findById(id).map(session -> {
            if (!session.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).<Object>body(Map.of("error", "Access denied."));
            }
            session.setRevoked(true);
            userSessionRepository.save(session);
            return ResponseEntity.ok(Map.of("message", "Session revoked successfully."));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/security/logout-all — Revoke all active sessions for the current user. */
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAllDevices() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        int revoked = userSessionRepository.revokeAllSessions(user);
        logger.info("Revoked {} sessions for user {}", revoked, user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Logged out from all " + revoked + " device(s)."));
    }

    /** PUT /api/security/change-password — Change user password. */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String current = body.get("currentPassword");
        String newPass = body.get("newPassword");

        if (current == null || current.isBlank() || newPass == null || newPass.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both currentPassword and newPassword are required."));
        }
        if (newPass.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters."));
        }

        try {
            userService.changePassword(user.getId(), current, newPass);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully. Please log in again."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/security/last-login — Get last login info. */
    @GetMapping("/last-login")
    public ResponseEntity<?> getLastLogin() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        return ResponseEntity.ok(Map.of(
            "lastLogin", user.getLastLogin() != null ? user.getLastLogin().format(FMT) : null,
            "lastLoginDevice", user.getLastLoginDevice() != null ? user.getLastLoginDevice() : "Unknown",
            "lastLoginIp", user.getLastLoginIp() != null ? user.getLastLoginIp() : "Unknown"
        ));
    }

    // ─── Helper ───────────────────────────────────────────────────────────
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userService.findById(principal.getId());
    }
}
