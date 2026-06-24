package com.citizenlex.controllers;

import com.citizenlex.dtos.CopilotRequest;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.UserRepository;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.GeminiService;
import com.citizenlex.services.LogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/copilot")
public class CopilotController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private LogService logService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeIssue(@Valid @RequestBody CopilotRequest request) {
        String analysisJson = geminiService.generateLegalCopilotPlan(
                request.getProblem(),
                request.getLanguage()
        );

        // Log copilot activity if authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) principal;
                User user = userRepository.findById(userPrincipal.getId()).orElse(null);
                if (user != null) {
                    String brief = request.getProblem().length() > 50 
                            ? request.getProblem().substring(0, 50) + "..." 
                            : request.getProblem();
                    logService.logActivity(user, "COPILOT", "Analyzed issue: " + brief);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("problem", request.getProblem());
        response.put("language", request.getLanguage());
        response.put("analysis", analysisJson);

        return ResponseEntity.ok(response);
    }
}
