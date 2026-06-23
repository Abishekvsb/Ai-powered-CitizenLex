package com.citizenlex.controllers;

import com.citizenlex.dtos.DraftRequest;
import com.citizenlex.services.GeminiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/drafts")
public class DraftController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateDraft(@Valid @RequestBody DraftRequest draftRequest) {
        String draftText = geminiService.generateLegalDraft(
                draftRequest.getType(),
                draftRequest.getLanguage(),
                draftRequest.getDetails()
        );

        Map<String, String> response = new HashMap<>();
        response.put("type", draftRequest.getType());
        response.put("language", draftRequest.getLanguage());
        response.put("draft", draftText);

        return ResponseEntity.ok(response);
    }
}
