package com.citizenlex.controllers;

import com.citizenlex.dtos.ProfileUpdateRequest;
import com.citizenlex.dtos.UserDto;
import com.citizenlex.entities.User;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.CloudinaryService;
import com.citizenlex.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * GET /api/profile/me — Get full profile details for the authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());
        return ResponseEntity.ok(toFullDto(user));
    }

    /**
     * PUT /api/profile/update — Update all profile fields (JSON body).
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            User updated = userService.updateFullProfile(principal.getId(), req);
            return ResponseEntity.ok(toFullDto(updated));
        } catch (Exception e) {
            logger.error("Error updating profile for user {}", principal.getId(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/profile/upload-photo — Upload profile photo (multipart).
     */
    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        // Delete old image from Cloudinary if it exists
        User existingUser = userService.findById(principal.getId());
        if (existingUser.getCloudinaryPublicId() != null) {
            cloudinaryService.deleteProfileImage(existingUser.getCloudinaryPublicId());
        }

        try {
            Map<String, String> uploadResult = cloudinaryService.uploadProfileImage(file, principal.getId());
            User updated = userService.updateProfileImage(principal.getId(), uploadResult.get("url"), uploadResult.get("publicId"));
            return ResponseEntity.ok(toFullDto(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error uploading profile photo for user {}: {}", principal.getId(), e.getMessage());
            String friendlyMsg = "Failed to upload image. Please try again.";
            if (e.getMessage() != null && e.getMessage().contains("cloud_name is disabled")) {
                friendlyMsg = "Photo upload service is not configured. Please contact support.";
            }
            return ResponseEntity.status(500).body(Map.of("error", friendlyMsg));
        }
    }

    /**
     * DELETE /api/profile/remove-photo — Remove profile photo.
     */
    @DeleteMapping("/remove-photo")
    public ResponseEntity<?> removePhoto() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            String oldPublicId = userService.removeProfileImage(principal.getId());
            cloudinaryService.deleteProfileImage(oldPublicId);
            User updated = userService.findById(principal.getId());
            return ResponseEntity.ok(toFullDto(updated));
        } catch (Exception e) {
            logger.error("Error removing profile photo for user {}", principal.getId(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to remove photo. Please try again."));
        }
    }

    // ---------- Helpers ----------

    private UserPrincipal getAuthenticatedPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    /**
     * Build a fully-populated UserDto from a User entity (includes all extended fields).
     */
    public static UserDto toFullDto(User user) {
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName())
                .orElse("ROLE_USER");

        UserDto dto = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                role,
                user.getCreatedAt(),
                user.getProfileImageUrl(),
                user.getMobile(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getState(),
                user.getDistrict(),
                user.getAddress(),
                user.getPreferredLanguage(),
                user.getOccupation()
        );

        // Verification status
        dto.setEmailVerified(Boolean.TRUE.equals(user.getEmailVerified()));
        dto.setMobileVerified(Boolean.TRUE.equals(user.getMobileVerified()));

        // Login audit
        if (user.getLastLogin() != null) {
            dto.setLastLogin(user.getLastLogin().toString());
        }
        dto.setLastLoginDevice(user.getLastLoginDevice());

        // Notification preferences
        dto.setEmailNotifications(user.getEmailNotifications());
        dto.setPushNotifications(user.getPushNotifications());
        dto.setReminderNotifications(user.getReminderNotifications());
        dto.setMarketingEmails(user.getMarketingEmails());
        dto.setProductUpdates(user.getProductUpdates());

        return dto;
    }
}
