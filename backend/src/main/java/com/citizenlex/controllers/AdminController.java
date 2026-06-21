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

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDto> getAnalytics() {
        AdminAnalyticsDto dto = new AdminAnalyticsDto(
                userRepository.count(),
                rightsContentRepository.count(),
                governmentSchemeRepository.count(),
                userDocumentRepository.count(),
                chatHistoryRepository.count()
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers().stream()
                .map(user -> new UserDto(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRoles().stream().findFirst().map(r -> r.getName()).orElse("ROLE_USER"),
                        user.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> changeUserRole(@PathVariable Long id, @RequestParam String role) {
        User updated = userService.changeUserRole(id, role);
        UserDto userDto = new UserDto(
                updated.getId(),
                updated.getEmail(),
                updated.getFirstName(),
                updated.getLastName(),
                role,
                updated.getCreatedAt()
        );
        return ResponseEntity.ok(userDto);
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
