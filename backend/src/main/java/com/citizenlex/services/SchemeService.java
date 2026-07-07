package com.citizenlex.services;

import com.citizenlex.entities.GovernmentScheme;
import com.citizenlex.repositories.GovernmentSchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.List;

@Service
public class SchemeService {

    @Autowired
    private GovernmentSchemeRepository schemeRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private GeminiService geminiService;

    // ================= URL VALIDATION =================

    /**
     * Validates that a URL belongs to an official Indian government domain.
     * Only .gov.in, .nic.in, and myscheme.gov.in are allowed.
     * Returns null if the URL is invalid, AI-fabricated, or not from a trusted domain.
     */
    public static String sanitizeOfficialLink(String url) {
        if (url == null || url.trim().isEmpty()) return null;
        try {
            URI uri = new URI(url.trim());
            String host = uri.getHost();
            if (host == null) return null;
            host = host.toLowerCase();
            if (host.endsWith(".gov.in") || host.endsWith(".nic.in")
                    || host.equals("myscheme.gov.in")
                    || host.endsWith(".myscheme.gov.in")) {
                return url.trim();
            }
        } catch (Exception e) {
            // Malformed URL
        }
        return null;
    }

    private GovernmentScheme sanitizeScheme(GovernmentScheme scheme) {
        if (scheme != null) {
            scheme.setOfficialLink(sanitizeOfficialLink(scheme.getOfficialLink()));
        }
        return scheme;
    }

    // ================= DATABASE METHODS =================

    public List<GovernmentScheme> getAllSchemes() {
        List<GovernmentScheme> schemes = schemeRepository.findAll();
        schemes.forEach(this::sanitizeScheme);
        return schemes;
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
        List<GovernmentScheme> results;
        if (query == null || query.trim().isEmpty()) {
            results = schemeRepository.findAll();
        } else {
            results = schemeRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrEligibilityContainingIgnoreCase(
                    query, query, query
            );
        }
        results.forEach(this::sanitizeScheme);
        return results;
    }

    // ================= AI SEARCH (FIXED + SAFE) =================

    public String getAISchemeResponse(String query) {

        try {
            String prompt =
                    "You are an Indian Government AI Assistant.\n" +
                    "Return 5 to 10 real Indian government schemes matching the query.\n" +
                    "If no exact match, suggest related real government schemes.\n" +
                    "Never return empty response.\n\n" +

                    "Each result must include:\n" +
                    "- name (string)\n" +
                    "- description (string)\n" +
                    "- eligibility (string)\n" +
                    "- how_to_apply (string, offline instructions only, DO NOT fabricate links)\n" +
                    "- department (string, the ministry or department name)\n" +
                    "- benefits (string, key benefits of the scheme)\n" +
                    "- helpline (string, official helpline number if known, otherwise empty string)\n\n" +

                    "CRITICAL: Do NOT include any URLs or website links in your response.\n" +
                    "CRITICAL: Only include information you are certain about from real government data.\n" +
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