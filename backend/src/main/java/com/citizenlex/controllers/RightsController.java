package com.citizenlex.controllers;

import com.citizenlex.entities.RightsCategory;
import com.citizenlex.entities.RightsContent;
import com.citizenlex.services.RightsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rights")
public class RightsController {

    @Autowired
    private RightsService rightsService;

    // --- CATEGORY ENDPOINTS ---

    @GetMapping("/categories")
    public ResponseEntity<List<RightsCategory>> getAllCategories() {
        return ResponseEntity.ok(rightsService.getAllCategories());
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<RightsCategory> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(rightsService.getCategoryById(id));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RightsCategory> createCategory(@RequestBody RightsCategory category) {
        return ResponseEntity.ok(rightsService.createCategory(category));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RightsCategory> updateCategory(@PathVariable Long id, @RequestBody RightsCategory category) {
        return ResponseEntity.ok(rightsService.updateCategory(id, category));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        rightsService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }

    // --- CONTENT ENDPOINTS ---

    @GetMapping("/contents")
    public ResponseEntity<List<RightsContent>> getAllContents() {
        return ResponseEntity.ok(rightsService.getAllContents());
    }

    @GetMapping("/contents/category/{categoryId}")
    public ResponseEntity<List<RightsContent>> getContentsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(rightsService.getContentsByCategory(categoryId));
    }

    @GetMapping("/contents/{id}")
    public ResponseEntity<RightsContent> getContentById(@PathVariable Long id) {
        return ResponseEntity.ok(rightsService.getContentById(id));
    }

    @PostMapping("/contents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RightsContent> createContent(@RequestParam Long categoryId, @RequestBody RightsContent content) {
        return ResponseEntity.ok(rightsService.createContent(categoryId, content));
    }

    @PutMapping("/contents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RightsContent> updateContent(@PathVariable Long id, @RequestBody RightsContent content) {
        return ResponseEntity.ok(rightsService.updateContent(id, content));
    }

    @DeleteMapping("/contents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id) {
        rightsService.deleteContent(id);
        return ResponseEntity.ok().build();
    }

    // --- SEARCH ENDPOINT ---

    @GetMapping("/search")
    public ResponseEntity<List<RightsContent>> searchRights(@RequestParam String query) {
        return ResponseEntity.ok(rightsService.searchRights(query));
    }

    @GetMapping(value = "/ai-search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> aiSearchRights(@RequestParam String query) {
        String jsonResult = rightsService.getAIRightsResponse(query);
        return ResponseEntity.ok(jsonResult);
    }
}
