package com.citizenlex.services;

import com.citizenlex.entities.RightsCategory;
import com.citizenlex.entities.RightsContent;
import com.citizenlex.repositories.RightsCategoryRepository;
import com.citizenlex.repositories.RightsContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RightsService {

    @Autowired
    private RightsCategoryRepository categoryRepository;

    @Autowired
    private RightsContentRepository contentRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private GeminiService geminiService;

    // --- CATEGORY OPERATIONS ---

    public List<RightsCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public RightsCategory getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    @Transactional
    public RightsCategory createCategory(RightsCategory category) {
        RightsCategory saved = categoryRepository.save(category);
        logService.logActivity((com.citizenlex.entities.User) null, "CREATE_CATEGORY", "Admin created category: " + category.getName());
        return saved;
    }

    @Transactional
    public RightsCategory updateCategory(Long id, RightsCategory details) {
        RightsCategory category = getCategoryById(id);
        category.setName(details.getName());
        category.setDescription(details.getDescription());
        category.setIcon(details.getIcon());
        RightsCategory saved = categoryRepository.save(category);
        logService.logActivity((com.citizenlex.entities.User) null, "UPDATE_CATEGORY", "Admin updated category: " + category.getName());
        return saved;
    }

    @Transactional
    public void deleteCategory(Long id) {
        RightsCategory category = getCategoryById(id);
        // Before deleting, delete contents under this category
        List<RightsContent> contents = contentRepository.findByCategoryId(id);
        contentRepository.deleteAll(contents);
        categoryRepository.delete(category);
        logService.logActivity((com.citizenlex.entities.User) null, "DELETE_CATEGORY", "Admin deleted category: " + category.getName());
    }

    // --- CONTENT OPERATIONS ---

    public List<RightsContent> getAllContents() {
        return contentRepository.findAll();
    }

    public List<RightsContent> getContentsByCategory(Long categoryId) {
        return contentRepository.findByCategoryId(categoryId);
    }

    public RightsContent getContentById(Long id) {
        return contentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rights content not found with id: " + id));
    }

    @Transactional
    public RightsContent createContent(Long categoryId, RightsContent content) {
        RightsCategory category = getCategoryById(categoryId);
        content.setCategory(category);
        RightsContent saved = contentRepository.save(content);
        logService.logActivity((com.citizenlex.entities.User) null, "CREATE_RIGHTS_CONTENT", "Admin created rights article: " + content.getTitle());
        return saved;
    }

    @Transactional
    public RightsContent updateContent(Long id, RightsContent details) {
        RightsContent content = getContentById(id);
        content.setTitle(details.getTitle());
        content.setContent(details.getContent());
        content.setTamilTitle(details.getTamilTitle());
        content.setTamilContent(details.getTamilContent());
        content.setResources(details.getResources());
        if (details.getCategory() != null && details.getCategory().getId() != null) {
            RightsCategory category = getCategoryById(details.getCategory().getId());
            content.setCategory(category);
        }
        RightsContent saved = contentRepository.save(content);
        logService.logActivity((com.citizenlex.entities.User) null, "UPDATE_RIGHTS_CONTENT", "Admin updated rights article: " + content.getTitle());
        return saved;
    }

    @Transactional
    public void deleteContent(Long id) {
        RightsContent content = getContentById(id);
        contentRepository.delete(content);
        logService.logActivity((com.citizenlex.entities.User) null, "DELETE_RIGHTS_CONTENT", "Admin deleted rights article: " + content.getTitle());
    }

    // --- SEARCH ---

    public List<RightsContent> searchRights(String query) {
        if (query == null || query.trim().isEmpty()) {
            return contentRepository.findAll();
        }
        return contentRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrTamilTitleContainingIgnoreCaseOrTamilContentContainingIgnoreCase(
                query, query, query, query
        );
    }

    // ================= AI SEARCH =================

    public String getAIRightsResponse(String query) {
        return geminiService.getAIRightsResponse(query);
    }
}
