package com.citizenlex.controllers;

import com.citizenlex.dtos.JwtAuthenticationResponse;
import com.citizenlex.dtos.LoginRequest;
import com.citizenlex.dtos.RegisterRequest;
import com.citizenlex.dtos.UserDto;
import com.citizenlex.entities.User;
import com.citizenlex.entities.UserSession;
import com.citizenlex.repositories.UserSessionRepository;
import com.citizenlex.security.JwtTokenProvider;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.LogService;
import com.citizenlex.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private LogService logService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = new User(
                registerRequest.getEmail(),
                registerRequest.getPassword(),
                registerRequest.getFirstName(),
                registerRequest.getLastName()
        );

        User registered = userService.registerUser(user, "ROLE_USER");
        logService.logActivity(registered, "REGISTER", "New user registration: " + registered.getEmail());
        return ResponseEntity.ok(ProfileController.toFullDto(registered));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userService.findById(userPrincipal.getId());

        // Create session record
        String sessionId = UUID.randomUUID().toString();
        String ip = getClientIp(request);
        String ua = request.getHeader("User-Agent");
        String device = parseUserAgent(ua);

        UserSession session = new UserSession(user, sessionId, ip, ua, device);
        userSessionRepository.save(session);

        // Update last login info on user
        user.setLastLogin(LocalDateTime.now());
        user.setLastLoginDevice(device);
        user.setLastLoginIp(ip);
        userService.save(user);

        // Log login activity
        logService.logActivity(user, "LOGIN", "Login from " + device + " (" + ip + ")");

        String jwt = tokenProvider.generateToken(authentication, sessionId);
        UserDto userDto = ProfileController.toFullDto(user);

        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(410).body("User not authenticated");
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userService.findById(principal.getId());
        return ResponseEntity.ok(ProfileController.toFullDto(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestParam(required = false) String password,
                                           @RequestParam String firstName,
                                           @RequestParam String lastName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        User updated = userService.updateProfile(principal.getId(), firstName, lastName, password);
        return ResponseEntity.ok(ProfileController.toFullDto(updated));
    }

    // --- Helpers ---

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String parseUserAgent(String ua) {
        if (ua == null || ua.isBlank()) return "Unknown Device";
        String lower = ua.toLowerCase();
        String browser = "Unknown Browser";
        String os = "Unknown OS";

        if (lower.contains("edg/") || lower.contains("edge/")) browser = "Edge";
        else if (lower.contains("opr/") || lower.contains("opera")) browser = "Opera";
        else if (lower.contains("chrome")) browser = "Chrome";
        else if (lower.contains("firefox")) browser = "Firefox";
        else if (lower.contains("safari") && !lower.contains("chrome")) browser = "Safari";

        if (lower.contains("iphone") || lower.contains("ipad")) os = "iOS";
        else if (lower.contains("android")) os = "Android";
        else if (lower.contains("windows")) os = "Windows";
        else if (lower.contains("macintosh") || lower.contains("mac os x")) os = "macOS";
        else if (lower.contains("linux")) os = "Linux";

        return browser + " on " + os;
    }
}
