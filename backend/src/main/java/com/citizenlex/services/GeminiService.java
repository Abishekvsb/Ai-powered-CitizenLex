package com.citizenlex.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.*;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${app.gemini.key:mock}")
    private String apiKey;

    @Value("${app.gemini.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(60000);
        return new RestTemplate(factory);
    }

    // ================= GEMINI CALL =================
    private String getGeminiResponse(String prompt, String systemInstructionText, double temperature) {

        if (apiKey == null || apiKey.trim().isEmpty() || "mock".equalsIgnoreCase(apiKey.trim())) {
            logger.warn("Gemini API key is missing or set to mock. Returning null for AI response.");
            return null;
        }

        try {
            String url = apiUrl + "?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();

            // CONTENT
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            requestBody.put("contents", List.of(content));

            // SYSTEM INSTRUCTION
            if (systemInstructionText != null && !systemInstructionText.isEmpty()) {
                Map<String, Object> siPart = new HashMap<>();
                siPart.put("text", systemInstructionText);

                Map<String, Object> systemInstruction = new HashMap<>();
                systemInstruction.put("parts", List.of(siPart));

                requestBody.put("systemInstruction", systemInstruction);
            }

            // CONFIG
            Map<String, Object> config = new HashMap<>();
            config.put("temperature", temperature);
            requestBody.put("generationConfig", config);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            logger.info("Calling Gemini API...");

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, entity, Map.class);

            logger.info("Gemini HTTP Status: {}", response.getStatusCode());

            if (response.getBody() != null) {
                String result = parseGeminiResponse(response.getBody());
                if (result != null && !result.trim().isEmpty()) {
                    logger.info("Gemini returned a valid response.");
                    return result;
                }
            }

        } catch (Exception e) {
            logger.error("Gemini API FAILED: {}", e.getMessage());
        }

        return null;
    }

    // ================= PARSER =================
    private String parseGeminiResponse(Map responseBody) {
        try {
            List candidates = (List) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return null;

            Map candidate = (Map) candidates.get(0);
            Map content = (Map) candidate.get("content");
            if (content == null) return null;

            List parts = (List) content.get("parts");
            if (parts == null || parts.isEmpty()) return null;

            Map part = (Map) parts.get(0);
            return (String) part.get("text");

        } catch (Exception e) {
            logger.error("Parse error: {}", e.getMessage());
            return null;
        }
    }

    // ================= CLEAN JSON =================
    private String cleanJsonResponse(String response) {
        if (response == null) return "[]";

        response = response.replace("```json", "")
                           .replace("```JSON", "")
                           .replace("```", "")
                           .trim();

        int start = response.indexOf("[");
        int end = response.lastIndexOf("]");

        if (start != -1 && end != -1 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
    }

    // ================= CLEAN JSON OBJECT =================
    private String cleanJsonObjectResponse(String response) {
        if (response == null) return "{}";

        response = response.replace("```json", "")
                           .replace("```JSON", "")
                           .replace("```", "")
                           .trim();

        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");

        if (start != -1 && end != -1 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
    }

    // ================= SCHEME API =================
    public String getAISchemeResponse(String query) {

        String response = getGeminiResponse(
                query,
                "You are a government scheme expert for India. Return exactly 5 relevant government schemes as a JSON array. Each object must have: name, description, eligibility, how_to_apply. Return ONLY valid JSON, no extra text.",
                0.4
        );

        if (response != null && !response.trim().isEmpty()) {
            return cleanJsonResponse(response);
        }

        // Fallback: return relevant hardcoded schemes
        return "[" +
            "{\"name\":\"PM Kisan Samman Nidhi\",\"description\":\"Income support of Rs 6000 per year to farmer families\",\"eligibility\":\"Small and marginal farmers with land holding up to 2 hectares\",\"how_to_apply\":\"Apply at pmkisan.gov.in or nearest CSC\"}," +
            "{\"name\":\"Ayushman Bharat PM-JAY\",\"description\":\"Health insurance cover of Rs 5 lakh per family per year\",\"eligibility\":\"Low income families as per SECC database\",\"how_to_apply\":\"Verify eligibility at pmjay.gov.in or empanelled hospitals\"}," +
            "{\"name\":\"PM Ujjwala Yojana\",\"description\":\"Free LPG connections to women from BPL households\",\"eligibility\":\"Women from BPL households, aged 18 years or above\",\"how_to_apply\":\"Apply at nearest LPG distributor with BPL card\"}," +
            "{\"name\":\"PM Awas Yojana\",\"description\":\"Financial assistance for construction of pucca houses\",\"eligibility\":\"Homeless or those living in kutcha houses in rural/urban areas\",\"how_to_apply\":\"Apply through Gram Panchayat or Urban Local Body\"}," +
            "{\"name\":\"Beti Bachao Beti Padhao\",\"description\":\"Scheme to promote welfare of girl child\",\"eligibility\":\"All girl children below 10 years of age\",\"how_to_apply\":\"Contact nearest bank or post office for Sukanya Samriddhi account\"}" +
        "]";
    }

    // ================= CHAT API =================
    public String getChatResponse(String prompt, String language) {
        String systemInstruction = "You are CitizenLex, an expert Indian legal assistant. Respond in a helpful, clear, and accurate manner. Language: " + language + ". Keep responses concise and informative. Format using paragraphs. Do not use markdown headers.";

        String response = getGeminiResponse(prompt, systemInstruction, 0.3);

        if (response != null && !response.trim().isEmpty()) {
            return response;
        }

        // Fallback response when Gemini is unavailable
        if ("ta".equalsIgnoreCase(language)) {
            return "மன்னிக்கவும், AI சேவை இப்போது கிடைக்கவில்லை. உங்கள் சட்ட கேள்விக்கு: " + prompt + " - தயவுசெய்து உங்கள் நியாய ஆலோசகரை அணுகவும் அல்லது சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
        }
        return "I'm sorry, the AI service is temporarily unavailable or experiencing high demand. Please try again in a few moments. Your question was: \"" + prompt + "\". For immediate legal assistance, you can browse our Rights Explorer or Government Scheme Finder sections.";
    }

    // ================= DOCUMENT SUMMARY API =================
    public String getDocumentSummary(String fileName, String extractedText) {
        String truncated = extractedText != null && extractedText.length() > 3000
                ? extractedText.substring(0, 3000) + "... [truncated]"
                : extractedText;

        String systemInstruction = "You are a legal document analyzer. Analyze the provided document and return a JSON object with these exact fields: document_type (string), summary (string, 2-3 sentences), key_points (array of strings, max 5 items), risks (array of strings, max 3 items), suggestions (array of strings, max 3 items). Return ONLY valid JSON, no markdown.";

        String response = getGeminiResponse(fileName + "\n" + truncated, systemInstruction, 0.2);

        if (response != null && !response.trim().isEmpty()) {
            return cleanJsonObjectResponse(response);
        }

        // Fallback: construct a basic summary from extracted text
        String snippet = (extractedText != null && extractedText.length() > 200)
                ? extractedText.substring(0, 200).replace("\"", "'") + "..."
                : (extractedText != null ? extractedText.replace("\"", "'") : "No text extracted.");

        return "{" +
            "\"document_type\":\"Legal Document\"," +
            "\"summary\":\"AI analysis is temporarily unavailable. The document '" + fileName.replace("\"", "'") + "' has been successfully uploaded and the text has been extracted. Please review the raw extracted text tab for details.\"," +
            "\"key_points\":[\"Document uploaded successfully\",\"Text extraction complete\",\"AI summarization is currently unavailable - please retry later\"]," +
            "\"risks\":[\"Manual review recommended as AI analysis is unavailable\"]," +
            "\"suggestions\":[\"Try uploading again in a few minutes when AI service is available\",\"Review the extracted raw text for important clauses\"]}";
    }

    // ================= RIGHTS API =================
    public String getAIRightsResponse(String query) {
        String systemInstruction = "You are an Indian constitutional and legal rights expert. Return relevant Indian legal rights as a JSON array. Each object must have: title (string), description (string), applicable_law (string). Return ONLY valid JSON array, no extra text.";

        String response = getGeminiResponse(query, systemInstruction, 0.4);

        if (response != null && !response.trim().isEmpty()) {
            return cleanJsonResponse(response);
        }

        // Fallback: return fundamental rights
        return "[" +
            "{\"title\":\"Right to Equality\",\"description\":\"Article 14-18 of the Indian Constitution guarantees equality before law, prohibits discrimination on grounds of religion, race, caste, sex or place of birth, and ensures equal opportunity in public employment.\",\"applicable_law\":\"Articles 14-18, Constitution of India\"}," +
            "{\"title\":\"Right to Freedom\",\"description\":\"Article 19-22 guarantees freedom of speech and expression, assembly, association, movement, residence, and profession. It also protects against arbitrary arrest and detention.\",\"applicable_law\":\"Articles 19-22, Constitution of India\"}," +
            "{\"title\":\"Right against Exploitation\",\"description\":\"Articles 23-24 prohibit human trafficking, forced labour (begar), and child labour in hazardous industries.\",\"applicable_law\":\"Articles 23-24, Constitution of India\"}," +
            "{\"title\":\"Right to Constitutional Remedies\",\"description\":\"Article 32 gives citizens the right to move the Supreme Court for enforcement of fundamental rights. This is considered the heart and soul of the Constitution.\",\"applicable_law\":\"Article 32, Constitution of India\"}," +
            "{\"title\":\"Right to Education\",\"description\":\"Article 21A makes free and compulsory education for children aged 6-14 years a fundamental right. The Right to Education Act 2009 operationalises this right.\",\"applicable_law\":\"Article 21A, RTE Act 2009\"}" +
        "]";
    }
}