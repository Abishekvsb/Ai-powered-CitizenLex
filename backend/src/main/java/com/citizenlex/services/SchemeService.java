package com.citizenlex.services;

import com.citizenlex.entities.GovernmentScheme;
import com.citizenlex.repositories.GovernmentSchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SchemeService {

    @Autowired
    private GovernmentSchemeRepository schemeRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private GeminiService geminiService;

    // ================= DATABASE METHODS =================

    public List<GovernmentScheme> getAllSchemes() {
        return schemeRepository.findAll();
    }

    public GovernmentScheme getSchemeById(Long id) {
        return schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Government scheme not found with id: " + id));
    }

    public List<GovernmentScheme> getSchemesByCategory(String category) {
        return schemeRepository.findByCategoryIgnoreCase(category);
    }

    @Transactional
    public GovernmentScheme createScheme(GovernmentScheme scheme) {

        GovernmentScheme saved = schemeRepository.save(scheme);

        logService.logActivity(
                "SYSTEM",
                "CREATE_SCHEME",
                "Admin created government scheme: " + scheme.getTitle()
        );

        return saved;
    }

    @Transactional
    public GovernmentScheme updateScheme(Long id, GovernmentScheme details) {

        GovernmentScheme scheme = getSchemeById(id);

        scheme.setTitle(details.getTitle());
        scheme.setCategory(details.getCategory());
        scheme.setEligibility(details.getEligibility());
        scheme.setRequiredDocuments(details.getRequiredDocuments());
        scheme.setApplicationProcess(details.getApplicationProcess());
        scheme.setOfficialLink(details.getOfficialLink());

        GovernmentScheme saved = schemeRepository.save(scheme);

        logService.logActivity(
                "SYSTEM",
                "UPDATE_SCHEME",
                "Admin updated government scheme: " + scheme.getTitle()
        );

        return saved;
    }

    @Transactional
    public void deleteScheme(Long id) {

        GovernmentScheme scheme = getSchemeById(id);
        schemeRepository.delete(scheme);

        logService.logActivity(
                "SYSTEM",
                "DELETE_SCHEME",
                "Admin deleted government scheme: " + scheme.getTitle()
        );
    }

    // ================= DATABASE SEARCH =================

    public List<GovernmentScheme> searchSchemes(String query) {

        if (query == null || query.trim().isEmpty()) {
            return schemeRepository.findAll();
        }

        return schemeRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrEligibilityContainingIgnoreCase(
                query, query, query
        );
    }

    // ================= AI SEARCH (FIXED + SAFE) =================

    public String getAISchemeResponse(String query) {

        try {
            String prompt =
                    "You are an Indian Government AI Assistant.\n" +
                    "Return 5 to 10 government schemes for ANY query.\n" +
                    "If no exact match, suggest related schemes.\n" +
                    "Never return empty response.\n\n" +

                    "Each result must include:\n" +
                    "- name\n" +
                    "- description\n" +
                    "- eligibility\n" +
                    "- how_to_apply\n\n" +

                    "Return ONLY valid JSON array.\n" +
                    "No extra text, no explanation.\n\n" +

                    "User query: " + query;

            System.out.println("🔥 AI PROMPT SENT: " + query);

            String response = geminiService.getAISchemeResponse(prompt);

            System.out.println("🔥 AI RAW RESPONSE: " + response);

            if (response == null || response.trim().length() < 10) {
                return "[]";
            }

            return response;

        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
}