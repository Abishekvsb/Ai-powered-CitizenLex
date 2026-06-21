package com.citizenlex.controllers;

import com.citizenlex.entities.UserDocument;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<UserDocument> uploadDocument(@RequestParam("file") MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        UserDocument doc = documentService.uploadAndAnalyze(principal.getId(), file);
        return ResponseEntity.ok(doc);
    }

    @GetMapping
    public ResponseEntity<List<UserDocument>> getDocuments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        List<UserDocument> docs = documentService.getUserDocuments(principal.getId());
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDocument> getDocumentById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        UserDocument doc = documentService.getDocumentById(id, principal.getId());
        return ResponseEntity.ok(doc);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        documentService.deleteDocument(id, principal.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/download-summary")
    public ResponseEntity<byte[]> downloadSummary(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        UserDocument doc = documentService.getDocumentById(id, principal.getId());
        
        byte[] summaryBytes = doc.getSummary().getBytes(StandardCharsets.UTF_8);
        String cleanFileName = doc.getFileName().replaceAll("[^a-zA-Z0-9.-]", "_") + "_summary.md";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cleanFileName + "\"")
                .contentType(MediaType.TEXT_MARKDOWN)
                .body(summaryBytes);
    }
}
