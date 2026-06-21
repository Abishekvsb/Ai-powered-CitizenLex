package com.citizenlex.controllers;

import com.citizenlex.entities.GovernmentScheme;
import com.citizenlex.services.SchemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schemes")
public class SchemeController {

    @Autowired
    private SchemeService schemeService;

    @GetMapping
    public ResponseEntity<List<GovernmentScheme>> getAllSchemes() {
        return ResponseEntity.ok(schemeService.getAllSchemes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GovernmentScheme> getSchemeById(@PathVariable Long id) {
        return ResponseEntity.ok(schemeService.getSchemeById(id));
    }

    @GetMapping("/category")
    public ResponseEntity<List<GovernmentScheme>> getSchemesByCategory(@RequestParam String category) {
        return ResponseEntity.ok(schemeService.getSchemesByCategory(category));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GovernmentScheme> createScheme(@RequestBody GovernmentScheme scheme) {
        return ResponseEntity.ok(schemeService.createScheme(scheme));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GovernmentScheme> updateScheme(@PathVariable Long id, @RequestBody GovernmentScheme scheme) {
        return ResponseEntity.ok(schemeService.updateScheme(id, scheme));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteScheme(@PathVariable Long id) {
        schemeService.deleteScheme(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<GovernmentScheme>> searchSchemes(@RequestParam String query) {
        return ResponseEntity.ok(schemeService.searchSchemes(query));
    }

    @GetMapping(value = "/ai-search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> aiSearchSchemes(@RequestParam String query) {
        String jsonResult = schemeService.getAISchemeResponse(query);
        return ResponseEntity.ok(jsonResult);
    }
}
