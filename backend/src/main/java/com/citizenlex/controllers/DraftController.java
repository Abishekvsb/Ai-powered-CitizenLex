package com.citizenlex.controllers;

import com.citizenlex.dtos.DraftRequest;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.UserRepository;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.GeminiService;
import com.citizenlex.services.LogService;
import com.citizenlex.utils.DocumentGeneratorUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/drafts")
public class DraftController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private LogService logService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateDraft(@Valid @RequestBody DraftRequest draftRequest) {
        String draftText = geminiService.generateLegalDraft(
                draftRequest.getType(),
                draftRequest.getLanguage(),
                draftRequest.getDetails()
        );

        // Log draft activity if authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) principal;
                User user = userRepository.findById(userPrincipal.getId()).orElse(null);
                if (user != null) {
                    logService.logActivity(user, "DRAFT", "Generated " + draftRequest.getType() + " in " + draftRequest.getLanguage());
                }
            }
        }

        Map<String, String> response = new HashMap<>();
        response.put("type", draftRequest.getType());
        response.put("language", draftRequest.getLanguage());
        response.put("draft", draftText);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/download/docx")
    public ResponseEntity<byte[]> downloadDocx(@RequestBody Map<String, String> request) {
        String type = request.getOrDefault("type", "Legal Draft");
        String content = request.getOrDefault("content", "");
        try {
            byte[] bytes = DocumentGeneratorUtil.generateDocx(type, content);
            String cleanFileName = type.replaceAll("[^a-zA-Z0-9.-]", "_") + "_draft.docx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cleanFileName + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/download/pdf")
    public ResponseEntity<byte[]> downloadPdf(@RequestBody Map<String, String> request) {
        String type = request.getOrDefault("type", "Legal Draft");
        String content = request.getOrDefault("content", "");
        try {
            byte[] bytes = DocumentGeneratorUtil.generatePdf(type, content);
            String cleanFileName = type.replaceAll("[^a-zA-Z0-9.-]", "_") + "_draft.pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cleanFileName + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

