package com.citizenlex.controllers;

import com.citizenlex.entities.User;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.EmailService;
import com.citizenlex.services.OtpService;
import com.citizenlex.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/verify")
public class VerificationController {

    private static final Logger logger = LoggerFactory.getLogger(VerificationController.class);

    @Autowired private UserService userService;
    @Autowired private EmailService emailService;
    @Autowired private OtpService otpService;

    @Value("${FRONTEND_URL:https://ai-powered-citizen-lex.vercel.app}")
    private String frontendUrl;

    // ─── Email Verification ────────────────────────────────────────────────

    @PostMapping("/email/request")
    public ResponseEntity<?> requestEmailVerification() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already verified."));
        }

        if (!emailService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email service is not configured."));
        }

        String token = UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userService.save(user);

        String link = frontendUrl + "/verify-email?token=" + token;
        try {
            emailService.sendEmailVerification(user.getEmail(), user.getFirstName(), link);
            logger.info("Email verification link for {}: {}", user.getEmail(), link);
            return ResponseEntity.ok(Map.of("message", "Verification email sent. Please check your inbox."));
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }
    }

    @PostMapping("/email/confirm")
    public ResponseEntity<?> confirmEmailVerification(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required."));
        }

        // Find user by token — scan all users is acceptable since this is rare
        // In production, a proper token table or indexed column is preferred
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        if (!token.equals(user.getEmailVerificationToken())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification token."));
        }
        if (user.getEmailVerificationTokenExpiry() == null
                || LocalDateTime.now().isAfter(user.getEmailVerificationTokenExpiry())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification token has expired. Please request a new one."));
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userService.save(user);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully!", "user", ProfileController.toFullDto(user)));
    }

    // ─── Mobile OTP Verification ───────────────────────────────────────────

    @PostMapping("/mobile/request")
    public ResponseEntity<?> requestMobileOtp() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (user.getMobile() == null || user.getMobile().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please add a mobile number to your profile first."));
        }
        if (Boolean.TRUE.equals(user.getMobileVerified())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mobile number is already verified."));
        }

        String otp = otpService.generateOtp();
        user.setMobileOtp(otp);
        user.setMobileOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userService.save(user);

        try {
            otpService.sendOtp(user.getMobile(), otp);
            
            if (otpService.isMock()) {
                return ResponseEntity.ok(Map.of(
                    "message", "[MOCK MODE] OTP generated successfully.",
                    "otp", otp,
                    "isMock", true
                ));
            }
            
            return ResponseEntity.ok(Map.of("message", "OTP sent to " + maskPhone(user.getMobile()) + ". Valid for 10 minutes."));
        } catch (Exception e) {
            logger.error("Failed to send OTP to {}: {}", user.getMobile(), e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/mobile/confirm")
    public ResponseEntity<?> confirmMobileOtp(@RequestBody Map<String, String> body) {
        String otp = body.get("otp");
        if (otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP is required."));
        }

        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        if (!otp.equals(user.getMobileOtp())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP."));
        }
        if (user.getMobileOtpExpiry() == null || LocalDateTime.now().isAfter(user.getMobileOtpExpiry())) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired. Please request a new one."));
        }

        user.setMobileVerified(true);
        user.setMobileOtp(null);
        user.setMobileOtpExpiry(null);
        userService.save(user);

        return ResponseEntity.ok(Map.of("message", "Mobile number verified successfully!", "user", ProfileController.toFullDto(user)));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return null;
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userService.findById(principal.getId());
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return phone.substring(0, phone.length() - 4).replaceAll(".", "*") + phone.substring(phone.length() - 4);
    }
}
