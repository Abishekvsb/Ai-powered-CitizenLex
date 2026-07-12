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

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("Gemini API FAILED: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
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

    // ================= GENERAL GENERATE RESPONSE API =================
    public String generateResponse(String prompt) {
        return getGeminiResponse(prompt, null, 0.4);
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
            return "à®®à®©à¯à®©à®¿à®•à¯à®•à®µà¯à®®à¯, AI à®šà¯‡à®µà¯ˆ à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®•à®¿à®Ÿà¯ˆà®•à¯à®•à®µà®¿à®²à¯à®²à¯ˆ. à®‰à®™à¯à®•à®³à¯ à®šà®Ÿà¯à®Ÿ à®•à¯‡à®³à¯à®µà®¿à®•à¯à®•à¯: " + prompt + " - à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®‰à®™à¯à®•à®³à¯ à®¨à®¿à®¯à®¾à®¯ à®†à®²à¯‹à®šà®•à®°à¯ˆ à®…à®£à¯à®•à®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®šà®¿à®±à®¿à®¤à¯ à®¨à¯‡à®°à®®à¯ à®•à®´à®¿à®¤à¯à®¤à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.";
        }
        return "I'm sorry, the AI service is temporarily unavailable or experiencing high demand. Please try again in a few moments. Your question was: \"" + prompt + "\". For immediate legal assistance, you can browse our Rights Explorer or Government Scheme Finder sections.";
    }

    // ================= DOCUMENT SUMMARY API =================
    public String getDocumentSummary(String fileName, String extractedText) {
        String truncated = extractedText != null && extractedText.length() > 4000
                ? extractedText.substring(0, 4000) + "... [truncated]"
                : extractedText;

        String systemInstruction = "You are an expert Indian legal document analyzer. Analyze the provided document and return a JSON object with these exact fields:\n" +
                "{\n" +
                "  \"document_type\": \"string (e.g. Agreement, Notice, Affidavit, RTI, Unknown)\",\n" +
                "  \"summary\": \"string (2-3 sentences clear summary)\",\n" +
                "  \"key_points\": [\"array of key points or findings from the document, max 5\"],\n" +
                "  \"legal_points\": [\"array of key legal points, rights, or obligations, max 5\"],\n" +
                "  \"risks\": [\"array of identified risks, pitfalls, or warnings, max 5\"],\n" +
                "  \"suggestions\": [\"array of general suggestions, recommendations, or advice, max 5\"],\n" +
                "  \"suggested_actions\": [\"array of suggested next steps or legal actions, max 5\"],\n" +
                "  \"key_names\": [\"array of key names of people, entities, or parties mentioned, max 5\"],\n" +
                "  \"dates\": [\"array of key dates mentioned, max 5\"],\n" +
                "  \"numbers\": [\"array of key numbers, monetary amounts, or codes, max 5\"]\n" +
                "}\n" +
                "Return ONLY valid JSON, no markdown. Do not include ```json in your response, just the raw JSON. If some field is not found, return empty array for arrays, or empty string/unknown.";

        String response = getGeminiResponse(fileName + "\n" + truncated, systemInstruction, 0.2);

        if (response != null && !response.trim().isEmpty()) {
            return cleanJsonObjectResponse(response);
        }

        // Fallback: construct a basic summary from extracted text
        return "{" +
            "\"document_type\":\"Legal Document\"," +
            "\"summary\":\"AI analysis is temporarily offline. The document has been uploaded and text has been extracted successfully.\"," +
            "\"key_points\":[\"Document uploaded successfully\",\"Text extraction completed\"]," +
            "\"legal_points\":[\"Document uploaded successfully\",\"Text extraction completed\"]," +
            "\"risks\":[]," +
            "\"suggestions\":[\"Review the raw extracted text manually\"]," +
            "\"suggested_actions\":[\"Review the raw extracted text manually\",\"Try analyzing again in a few minutes\"]," +
            "\"key_names\":[]," +
            "\"dates\":[]," +
            "\"numbers\":[]}";
    }

    public String extractTextFromFileMultimodal(byte[] fileBytes, String contentType) {
        if (apiKey == null || apiKey.trim().isEmpty() || "mock".equalsIgnoreCase(apiKey.trim())) {
            throw new IllegalArgumentException("Gemini API key is not configured or is set to 'mock'. OCR and Document Analysis require a valid Gemini API key.");
        }

        int maxAttempts = 3;
        int delayMs = 1000;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                String url = apiUrl + "?key=" + apiKey;

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> requestBody = new HashMap<>();

                // text part
                Map<String, Object> textPart = new HashMap<>();
                textPart.put("text", "Please extract and transcribe all visible text from this document exactly as it is. Do not summarize, do not comment, just return the raw text. Support both English and Tamil text.");

                // inlineData part
                Map<String, Object> inlineData = new HashMap<>();
                inlineData.put("mimeType", contentType != null ? contentType : "application/pdf");
                inlineData.put("data", Base64.getEncoder().encodeToString(fileBytes));

                Map<String, Object> filePart = new HashMap<>();
                filePart.put("inlineData", inlineData);

                Map<String, Object> content = new HashMap<>();
                content.put("parts", List.of(textPart, filePart));

                requestBody.put("contents", List.of(content));

                // config
                Map<String, Object> config = new HashMap<>();
                config.put("temperature", 0.1);
                requestBody.put("generationConfig", config);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                logger.info("Calling Gemini Multimodal OCR API (Attempt {}/{}) for type: {}...", attempt, maxAttempts, contentType);
                ResponseEntity<Map> response =
                        restTemplate.postForEntity(url, entity, Map.class);

                if (response.getBody() != null) {
                    String result = parseGeminiResponse(response.getBody());
                    if (result != null && !result.trim().isEmpty()) {
                        return result;
                    }
                }
                throw new IllegalArgumentException("No text could be parsed from the Gemini API response.");

            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                logger.warn("Gemini Multimodal OCR attempt {} failed: status={}, body={}", attempt, e.getStatusCode(), e.getResponseBodyAsString());
                lastException = e;
                if (e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE || e.getStatusCode().value() == 429) {
                    if (attempt < maxAttempts) {
                        try {
                            Thread.sleep(delayMs * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new IllegalArgumentException("OCR request was interrupted.");
                        }
                        continue;
                    }
                }
                if (e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                    throw new IllegalArgumentException("Gemini AI Service is temporarily overloaded (503 Service Unavailable). Please try again in a few moments.");
                } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS || e.getStatusCode().value() == 429) {
                    throw new IllegalArgumentException("Gemini AI Service rate limit exceeded (429 Too Many Requests). Please wait a moment and try again.");
                } else if (e.getStatusCode() == HttpStatus.BAD_REQUEST || e.getStatusCode() == HttpStatus.FORBIDDEN || e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    throw new IllegalArgumentException("Gemini AI Service authentication failed or request is invalid (status " + e.getStatusCode() + "). Please check your API key configuration.");
                } else {
                    throw new IllegalArgumentException("Gemini AI Service error: " + e.getStatusText() + " (status " + e.getStatusCode() + ")");
                }
            } catch (org.springframework.web.client.ResourceAccessException e) {
                logger.warn("Gemini Multimodal OCR attempt {} timed out/failed: {}", attempt, e.getMessage());
                lastException = e;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(delayMs * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IllegalArgumentException("OCR request was interrupted.");
                    }
                    continue;
                }
                throw new IllegalArgumentException("Connection to Gemini AI Service timed out or was refused. Please check network connectivity and try again.");
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                logger.error("Gemini Multimodal OCR failed at attempt " + attempt, e);
                lastException = e;
                if (attempt < maxAttempts) {
                    continue;
                }
                throw new IllegalArgumentException("An unexpected error occurred during OCR: " + e.getMessage());
            }
        }
        throw new IllegalArgumentException("OCR process failed after attempts. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
    }

    public String extractTextFromImageMultimodal(byte[] imageBytes, String contentType) {
        return extractTextFromFileMultimodal(imageBytes, contentType);
    }

    // ================= RIGHTS API =================
    public String getAIRightsResponse(String query) {
        String systemInstruction = "You are an expert Indian constitutional, civil, and criminal rights analyst. " +
                "Given the user's query, return exactly 3 relevant legal rights as a JSON array. " +
                "Each object must have these exact fields:\n" +
                "{\n" +
                "  \"title\": \"string (name of the right/law)\",\n" +
                "  \"explanation\": \"string (detailed explanation of the right)\",\n" +
                "  \"applicable_acts\": \"string (list of applicable acts or constitutional articles)\",\n" +
                "  \"ipc_bns_sections\": \"string (relevant IPC or BNS section numbers and titles)\",\n" +
                "  \"required_documents\": \"string (documents needed to claim/enforce this right, comma-separated)\",\n" +
                "  \"next_steps\": \"string (step-by-step action plan to enforce this right)\",\n" +
                "  \"nearby_authority\": \"string (the department or official to contact, e.g. Local Police, Tahsildar, Consumer Court)\",\n" +
                "  \"helpline\": \"string (official helpline number if available)\",\n" +
                "  \"government_portal\": \"string (official government website URL to file complaints or read more)\"\n" +
                "}\n" +
                "Return ONLY a valid JSON array, no extra text or markdown code blocks.";

        String response = getGeminiResponse(query, systemInstruction, 0.4);

        if (response != null && !response.trim().isEmpty()) {
            return cleanJsonResponse(response);
        }

        // Fallback: return fundamental rights
        return "[" +
            "{\"title\":\"Right to Equality\"," +
            "\"explanation\":\"Article 14-18 of the Indian Constitution guarantees equality before law and equal protection of laws. It prohibits discrimination on grounds of religion, race, caste, sex or place of birth.\"," +
            "\"applicable_acts\":\"Articles 14-18, Constitution of India\"," +
            "\"ipc_bns_sections\":\"N/A\"," +
            "\"required_documents\":\"Aadhaar Card, Community Certificate (if claiming reservation)\"," +
            "\"next_steps\":\"1. File a writ petition under Article 226 in High Court or Article 32 in Supreme Court if discrimination occurs. 2. Approach State Human Rights Commission.\"," +
            "\"nearby_authority\":\"District Collector Office, High Court of Madras\"," +
            "\"helpline\":\"1800-11-4555 (Legal Aid Helpline)\"," +
            "\"government_portal\":\"https://nalsa.gov.in\"}," +
            "{\"title\":\"Consumer Protection Rights\"," +
            "\"explanation\":\"The Consumer Protection Act 2019 guarantees protection against marketing of goods hazardous to life, and ensures the right to be informed about quality, quantity, purity, and standard of goods.\"," +
            "\"applicable_acts\":\"Consumer Protection Act, 2019\"," +
            "\"ipc_bns_sections\":\"Section 318 of BNS / Section 420 of IPC (Cheating)\"," +
            "\"required_documents\":\"Purchase Invoice, Warranty Card, Communication emails/letters\"," +
            "\"next_steps\":\"1. Send legal notice to opposite party. 2. If unresolved, file a consumer complaint on the e-daakhil portal within 2 years.\"," +
            "\"nearby_authority\":\"District Consumer Disputes Redressal Commission\"," +
            "\"helpline\":\"1800-11-4000 (National Consumer Helpline)\"," +
            "\"government_portal\":\"https://consumerhelpline.gov.in\"}" +
        "]";
    }


    // ================= LEGAL DRAFT GENERATOR API =================
    public String generateLegalDraft(String type, String language, String details) {
        String systemInstruction = "You are an expert Indian legal advisor. Generate a professional and detailed " + type + 
                " in " + ("ta".equalsIgnoreCase(language) ? "Tamil" : "English") + 
                " based on the user's provided details. The document must be formal, print-ready, and follow standard Indian legal formatting. " +
                "Include headers, subject lines, numbered paragraphs of facts, prayer/remedy requested, and signature blocks. " +
                "Do not return markdown bold headers or bullet points. Use standard text. Do not return any introduction or out-of-character comments. Return ONLY the document text.";

        String prompt = "Generate a " + type + " for: " + details;
        String response = getGeminiResponse(prompt, systemInstruction, 0.3);

        if (response != null && !response.trim().isEmpty()) {
            return response;
        }

        return generateFallbackDraft(type, language, details);
    }

    private String generateFallbackDraft(String type, String language, String details) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        
        if ("RTI Application".equalsIgnoreCase(type)) {
            if (isTamil) {
                return "à®¤à®•à®µà®²à¯ à®…à®±à®¿à®¯à¯à®®à¯ à®‰à®°à®¿à®®à¯ˆà®šà¯ à®šà®Ÿà¯à®Ÿà®®à¯ 2005, à®ªà®¿à®°à®¿à®µà¯ 6(1)-à®©à¯ à®•à¯€à®´à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯\n\n" +
                        "à®¤à¯‡à®¤à®¿: " + new java.util.Date().toString() + "\n\n" +
                        "à®ªà¯†à®±à¯à®¨à®°à¯:\n" +
                        "à®ªà¯Šà®¤à¯à®¤à¯ à®¤à®•à®µà®²à¯ à®…à®²à¯à®µà®²à®°à¯ à®…à®µà®°à¯à®•à®³à¯,\n" +
                        "[à®…à®²à¯à®µà®²à®• à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®®à®©à¯à®¤à®¾à®°à®°à¯:\n" +
                        "[à®‰à®™à¯à®•à®³à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®ªà¯Šà®°à¯à®³à¯: à®¤à®•à®µà®²à¯ à®…à®±à®¿à®¯à¯à®®à¯ à®‰à®°à®¿à®®à¯ˆà®šà¯ à®šà®Ÿà¯à®Ÿà®®à¯ 2005-à®©à¯ à®•à¯€à®´à¯ à®¤à®•à®µà®²à¯ à®µà¯‡à®£à¯à®Ÿà¯à®¤à®²à¯ - à®šà®¾à®°à¯à®ªà¯.\n\n" +
                        "à®µà®¿à®µà®°à®™à¯à®•à®³à¯:\n" +
                        "à®®à®©à¯à®¤à®¾à®°à®°à¯ à®•à¯‹à®°à¯à®®à¯ à®¤à®•à®µà®²à¯à®•à®³à¯ à®ªà®¿à®©à¯à®µà®°à¯à®®à®¾à®±à¯:\n" +
                        "1. [à®•à¯‹à®°à®ªà¯à®ªà®Ÿà¯à®®à¯ à®¤à®•à®µà®²à¯ 1 - à®µà®¿à®µà®°à®®à¯]\n" +
                        "2. [à®•à¯‹à®°à®ªà¯à®ªà®Ÿà¯à®®à¯ à®¤à®•à®µà®²à¯ 2 - à®µà®¿à®µà®°à®®à¯]\n" +
                        "à®ªà®¯à®©à®°à¯ à®µà®´à®™à¯à®•à®¿à®¯ à®µà®´à®•à¯à®•à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯: " + details + "\n\n" +
                        "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®•à¯ à®•à®Ÿà¯à®Ÿà®£à®®à¯:\n" +
                        "à®°à¯‚.10/- à®•à¯à®•à®¾à®© à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®µà®¿à®²à¯à®²à¯ˆ (Court Fee Stamp) à®’à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®¤à¯ / à®…à®²à¯à®²à®¤à¯ à®Ÿà®¿à®®à®¾à®£à¯à®Ÿà¯ à®Ÿà®¿à®°à®¾à®ªà¯à®Ÿà¯ à®‡à®£à¯ˆà®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®¤à¯.\n\n" +
                        "à®‡à®µà®£à¯,\n" +
                        "à®¤à®™à¯à®•à®³à¯ à®‰à®£à¯à®®à¯ˆà®¯à¯à®³à¯à®³,\n\n" +
                        "(à®®à®©à¯à®¤à®¾à®°à®°à®¿à®©à¯ à®•à¯ˆà®¯à¯Šà®ªà¯à®ªà®®à¯)";
            } else {
                return "APPLICATION FOR OBTAINING INFORMATION UNDER SECTION 6(1) OF RTI ACT, 2005\n\n" +
                        "Date: " + new java.util.Date().toString() + "\n\n" +
                        "To,\n" +
                        "The Public Information Officer (PIO),\n" +
                        "[Name of the Office/Department]\n" +
                        "[Address]\n\n" +
                        "1. Full Name of the Applicant: [Your Name]\n" +
                        "2. Address: [Your Full Address]\n" +
                        "3. Particulars of Information required:\n" +
                        "   a) Subject Matter of Information: [Subject]\n" +
                        "   b) Details of information requested:\n" +
                        "      - [Specify detail 1]\n" +
                        "      - [Specify detail 2]\n" +
                        "   c) Additional details provided by applicant:\n" +
                        "      " + details + "\n\n" +
                        "4. Application fee details: Demand Draft / Indian Postal Order / Court Fee stamp of Rs. 10/- attached.\n\n" +
                        "Yours faithfully,\n\n" +
                        "(Signature of the Applicant)";
            }
        } else if ("Consumer Complaint".equalsIgnoreCase(type)) {
            if (isTamil) {
                return "à®®à®¾à®µà®Ÿà¯à®Ÿ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®†à®£à¯ˆà®¯à®®à¯ à®®à¯à®©à¯\n\n" +
                        "à®¤à¯‡à®¤à®¿: " + new java.util.Date().toString() + "\n\n" +
                        "à®ªà¯à®•à®¾à®°à¯à®¤à®¾à®°à®°à¯:\n" +
                        "[à®‰à®™à¯à®•à®³à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®Žà®¤à®¿à®°à¯à®®à®©à¯à®¤à®¾à®°à®°à¯:\n" +
                        "[à®¨à®¿à®±à¯à®µà®©à®®à¯/à®µà®¿à®±à¯à®ªà®©à¯ˆà®¯à®¾à®³à®°à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®ªà¯Šà®°à¯à®³à¯: à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà¯à®šà¯ à®šà®Ÿà¯à®Ÿà®®à¯, 2019-à®©à¯ à®•à¯€à®´à¯ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®ªà¯à®•à®¾à®°à¯ à®®à®©à¯.\n\n" +
                        "à®ªà¯à®•à®¾à®°à®¿à®©à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯:\n" +
                        "1. à®ªà¯à®•à®¾à®°à¯à®¤à®¾à®°à®°à®¾à®•à®¿à®¯ à®¨à®¾à®©à¯ à®Žà®¤à®¿à®°à¯à®®à®©à¯à®¤à®¾à®°à®°à®¿à®Ÿà®®à¯ à®‡à®°à¯à®¨à¯à®¤à¯ [à®ªà¯Šà®°à¯à®³à¯/à®šà¯‡à®µà¯ˆ] à®µà®¾à®™à¯à®•à®¿à®©à¯‡à®©à¯.\n" +
                        "2. à®ªà®¯à®©à®°à¯ à®µà®´à®™à¯à®•à®¿à®¯ à®µà®´à®•à¯à®•à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯: " + details + "\n" +
                        "3. à®‡à®¤à®©à®¾à®²à¯ à®Žà®©à®•à¯à®•à¯ à®à®±à¯à®ªà®Ÿà¯à®Ÿ à®¨à®·à¯à®Ÿà®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à®© à®‰à®³à¯ˆà®šà¯à®šà®²à¯à®•à¯à®•à¯ à®Žà®¤à®¿à®°à¯à®®à®©à¯à®¤à®¾à®°à®°à¯ à®ªà¯Šà®±à¯à®ªà¯à®ªà¯‡à®±à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯.\n\n" +
                        "à®µà¯‡à®£à¯à®Ÿà¯à®¤à®²à¯ (Prayer):\n" +
                        "à®Žà®©à®µà¯‡, à®‡à®¨à¯à®¤ à®®à®¾à®£à¯à®ªà¯à®®à®¿à®•à¯ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®†à®£à¯ˆà®¯à®®à¯ à®Žà®©à®•à¯à®•à¯ à®à®±à¯à®ªà®Ÿà¯à®Ÿ à®‡à®´à®ªà¯à®ªà®¿à®±à¯à®•à¯ à®¤à®•à¯à®¨à¯à®¤ à®‡à®´à®ªà¯à®ªà¯€à®Ÿà¯ à®ªà¯†à®±à¯à®±à¯à®¤à¯ à®¤à®°à¯à®®à¯à®ªà®Ÿà®¿ à®ªà®£à®¿à®µà¯à®Ÿà®©à¯ à®•à¯‡à®Ÿà¯à®Ÿà¯à®•à¯à®•à¯Šà®³à¯à®•à®¿à®±à¯‡à®©à¯.\n\n" +
                        "à®‡à®µà®£à¯,\n" +
                        "à®¤à®™à¯à®•à®³à¯ à®‰à®£à¯à®®à¯ˆà®¯à¯à®³à¯à®³,\n\n" +
                        "(à®ªà¯à®•à®¾à®°à¯à®¤à®¾à®°à®°à¯ à®•à¯ˆà®¯à¯Šà®ªà¯à®ªà®®à¯)";
            } else {
                return "BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION\n\n" +
                        "Date: " + new java.util.Date().toString() + "\n\n" +
                        "IN THE MATTER OF:\n" +
                        "[Your Name]\n" +
                        "[Your Address]\t\t\t...COMPLAINANT\n\n" +
                        "VERSUS\n\n" +
                        "[Name of the Company/Seller]\n" +
                        "[Address of the Opp. Party]\t...OPPOSITE PARTY\n\n" +
                        "COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019\n\n" +
                        "Respectfully Showeth:\n" +
                        "1. That the Complainant is a resident of [Your Address] and purchased [Product/Service] from the Opposite Party.\n" +
                        "2. Particulars of Deficiency / Unfair Trade Practice:\n" +
                        "   " + details + "\n" +
                        "3. That the Complainant sent notices/reminders but the Opposite Party failed to rectify the defect / resolve the grievance.\n\n" +
                        "PRAYER:\n" +
                        "It is, therefore, most respectfully prayed that this Hon'ble Commission may be pleased to:\n" +
                        "a) Direct the Opposite Party to replace the product / refund the amount of Rs. [Amount].\n" +
                        "b) Award compensation for mental agony and litigation expenses.\n\n" +
                        "Complainant\n\n" +
                        "(Signature)";
            }
        } else if ("Police Complaint Draft".equalsIgnoreCase(type)) {
            if (isTamil) {
                return "à®•à®¾à®µà®²à¯ à®¨à®¿à®²à¯ˆà®¯ à®ªà¯à®•à®¾à®°à¯ à®®à®©à¯\n\n" +
                        "à®¤à¯‡à®¤à®¿: " + new java.util.Date().toString() + "\n" +
                        "à®‡à®Ÿà®®à¯: [à®‡à®Ÿà®®à¯]\n\n" +
                        "à®ªà¯†à®±à¯à®¨à®°à¯:\n" +
                        "à®•à®¾à®µà®²à¯ à®¨à®¿à®²à¯ˆà®¯ à®†à®¯à¯à®µà®¾à®³à®°à¯ à®…à®µà®°à¯à®•à®³à¯,\n" +
                        "[à®•à®¾à®µà®²à¯ à®¨à®¿à®²à¯ˆà®¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®ªà¯à®•à®¾à®°à¯à®¤à®¾à®°à®°à¯:\n" +
                        "[à®‰à®™à¯à®•à®³à¯ à®ªà¯†à®¯à®°à¯, à®¤à®¨à¯à®¤à¯ˆ à®ªà¯†à®¯à®°à¯, à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®ªà¯Šà®°à¯à®³à¯: à®•à¯à®±à¯à®±à®µà®¿à®¯à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®šà®Ÿà¯à®Ÿ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆ à®µà¯‡à®£à¯à®Ÿà¯à®¤à®²à¯ - à®šà®¾à®°à¯à®ªà¯.\n\n" +
                        "à®ªà¯à®•à®¾à®°à®¿à®©à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯:\n" +
                        "à®à®¯à®¾/à®…à®®à¯à®®à®¾, à®Žà®©à®¤à¯ à®ªà¯à®•à®¾à®°à¯ à®µà®¿à®µà®°à®®à¯ à®ªà®¿à®©à¯à®µà®°à¯à®®à®¾à®±à¯:\n" +
                        "à®ªà®¯à®©à®°à¯ à®µà®´à®™à¯à®•à®¿à®¯ à®šà®®à¯à®ªà®µ à®µà®¿à®µà®°à®™à¯à®•à®³à¯: " + details + "\n\n" +
                        "à®Žà®©à®µà¯‡, à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®Žà®©à®¤à¯ à®ªà¯à®•à®¾à®°à¯ˆà®ªà¯ à®ªà¯†à®±à¯à®±à¯à®•à¯à®•à¯Šà®£à¯à®Ÿà¯, à®šà®®à¯à®ªà®¨à¯à®¤à®ªà¯à®ªà®Ÿà¯à®Ÿ à®¨à®ªà®°à¯à®•à®³à¯ à®®à¯€à®¤à¯ à®šà®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà®¿ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆ à®Žà®Ÿà¯à®¤à¯à®¤à¯, à®Žà®©à®•à¯à®•à¯ à®¨à¯€à®¤à®¿ à®µà®´à®™à¯à®•à¯à®®à¯à®ªà®Ÿà®¿ à®•à¯‡à®Ÿà¯à®Ÿà¯à®•à¯à®•à¯Šà®³à¯à®•à®¿à®±à¯‡à®©à¯.\n\n" +
                        "à®‡à®µà®£à¯,\n" +
                        "à®¤à®™à¯à®•à®³à¯ à®‰à®£à¯à®®à¯ˆà®¯à¯à®³à¯à®³,\n\n" +
                        "(à®ªà¯à®•à®¾à®°à¯à®¤à®¾à®°à®°à®¿à®©à¯ à®•à¯ˆà®¯à¯Šà®ªà¯à®ªà®®à¯)";
            } else {
                return "FORMAL POLICE COMPLAINT\n\n" +
                        "Date: " + new java.util.Date().toString() + "\n" +
                        "Place: [Place]\n\n" +
                        "To,\n" +
                        "The Officer-in-Charge / Inspector of Police,\n" +
                        "[Name of the Police Station]\n" +
                        "[City/District]\n\n" +
                        "Subject: Complaint regarding [Incident/Offence] and request for legal action.\n\n" +
                        "Respected Sir/Madam,\n" +
                        "I, the undersigned [Your Name], residing at [Your Address], hereby lodge this formal complaint regarding the following incident:\n\n" +
                        "Details of the Incident/Offence:\n" +
                        "" + details + "\n\n" +
                        "Request:\n" +
                        "You are requested to register a First Information Report (FIR) / General Diary entry, investigate the matter, and take strict legal action against the accused persons in accordance with law.\n\n" +
                        "Yours faithfully,\n\n" +
                        "(Signature of Complainant)\n" +
                        "Contact Number: [Your Phone Number]";
            }
        } else if ("Legal Notice".equalsIgnoreCase(type)) {
            if (isTamil) {
                return "à®µà®´à®•à¯à®•à®±à®¿à®žà®°à¯ à®šà®Ÿà¯à®Ÿ à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯ (LEGAL NOTICE)\n\n" +
                        "à®¤à¯‡à®¤à®¿: " + new java.util.Date().toString() + "\n\n" +
                        "à®ªà¯†à®±à¯à®¨à®°à¯:\n" +
                        "[à®Žà®¤à®¿à®°à¯ à®¤à®°à®ªà¯à®ªà®¿à®©à®°à®¿à®©à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®Žà®©à®¤à¯ à®•à®¿à®³à¯ˆà®¯à®£à¯à®Ÿà¯ [à®‰à®™à¯à®•à®³à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿] à®Žà®©à¯à®ªà®µà®°à®¿à®©à¯ à®…à®±à®¿à®µà¯à®±à¯à®¤à¯à®¤à®²à®¿à®©à¯à®ªà®Ÿà®¿ à®¤à®™à¯à®•à®³à¯à®•à¯à®•à¯ à®…à®©à¯à®ªà¯à®ªà¯à®®à¯ à®šà®Ÿà¯à®Ÿ à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯:\n\n" +
                        "à®µà®´à®•à¯à®•à®¿à®©à¯ à®ªà®¿à®©à¯à®©à®£à®¿ à®µà®¿à®µà®°à®™à¯à®•à®³à¯:\n" +
                        "1. à®ªà®¯à®©à®°à¯ à®µà®´à®™à¯à®•à®¿à®¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯: " + details + "\n" +
                        "2. à®‡à®¨à¯à®¤ à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯ à®•à®¿à®Ÿà¯ˆà®¤à¯à®¤ 15 à®¨à®¾à®Ÿà¯à®•à®³à¯à®•à¯à®•à¯à®³à¯ à®¤à®¾à®™à¯à®•à®³à¯ à®Žà®©à¯ à®•à®¿à®³à¯ˆà®¯à®£à¯à®Ÿà®¿à®±à¯à®•à¯ à®‰à®°à®¿à®¯ à®¤à¯€à®°à¯à®µà¯ à®µà®´à®™à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯.\n" +
                        "3. à®¤à®µà®±à®¿à®©à®¾à®²à¯, à®šà®¿à®µà®¿à®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®¿à®°à®¿à®®à®¿à®©à®²à¯ à®šà®Ÿà¯à®Ÿà®™à¯à®•à®³à®¿à®©à¯ à®•à¯€à®´à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®¤à¯à®¤à®¿à®²à¯ à®µà®´à®•à¯à®•à¯ à®¤à¯Šà®Ÿà®°à®ªà¯à®ªà®Ÿà¯à®®à¯ à®Žà®©à¯à®ªà®¤à¯ˆ à®¤à¯†à®°à®¿à®µà®¿à®¤à¯à®¤à¯à®•à¯ à®•à¯Šà®³à¯à®•à®¿à®±à¯‡à®©à¯.\n\n" +
                        "à®µà®´à®•à¯à®•à®±à®¿à®žà®°à®¿à®©à¯ à®•à¯ˆà®¯à¯Šà®ªà¯à®ªà®®à¯\n\n" +
                        "(à®šà®Ÿà¯à®Ÿ à®†à®²à¯‹à®šà®•à®°à¯)";
            } else {
                return "LEGAL NOTICE\n\n" +
                        "Date: " + new java.util.Date().toString() + "\n\n" +
                        "To,\n" +
                        "[Recipient Name]\n" +
                        "[Recipient Address]\n\n" +
                        "Dear Sir/Madam,\n\n" +
                        "Under instructions from my client, [Your Name], residing at [Your Address], I hereby serve you with this formal Legal Notice:\n\n" +
                        "1. Statements of Facts:\n" +
                        "   " + details + "\n" +
                        "2. You are hereby called upon to comply with my client's demands / settle the outstanding dues within 15 days from the receipt of this notice.\n" +
                        "3. In the event of your failure to comply with the terms of this notice, I have clear instructions to initiate appropriate legal proceedings against you in a court of competent jurisdiction at your risk as to costs and consequences.\n\n" +
                        "Yours sincerely,\n\n" +
                        "(Advocate / Legal Representative)";
            }
        } else { // Grievance Petition / Default
            if (isTamil) {
                return "à®ªà¯Šà®¤à¯ à®®à®•à¯à®•à®³à¯ à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®®à®©à¯\n\n" +
                        "à®¤à¯‡à®¤à®¿: " + new java.util.Date().toString() + "\n\n" +
                        "à®ªà¯†à®±à¯à®¨à®°à¯:\n" +
                        "à®®à®¾à®µà®Ÿà¯à®Ÿ à®†à®Ÿà¯à®šà®¿à®¯à®°à¯ à®…à®µà®°à¯à®•à®³à¯ / à®¤à®•à¯à®¤à®¿à®µà®¾à®¯à¯à®¨à¯à®¤ à®…à®¤à®¿à®•à®¾à®°à®¿,\n" +
                        "[à®…à®²à¯à®µà®²à®• à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®®à®©à¯à®¤à®¾à®°à®°à¯:\n" +
                        "[à®‰à®™à¯à®•à®³à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿]\n\n" +
                        "à®ªà¯Šà®°à¯à®³à¯: [à®®à®©à¯à®µà®¿à®©à¯ à®¤à®²à¯ˆà®ªà¯à®ªà¯] - à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®¨à®Ÿà®µà®Ÿà®¿à®•à¯à®•à¯ˆ à®•à¯‹à®°à¯à®¤à®²à¯ - à®šà®¾à®°à¯à®ªà¯.\n\n" +
                        "à®®à®©à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯:\n" +
                        "à®à®¯à®¾/à®…à®®à¯à®®à®¾, à®¨à®¾à®©à¯ à®¤à®™à¯à®•à®³à¯à®•à¯à®•à¯ à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à¯à®®à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ à®®à®©à¯ à®µà®¿à®µà®°à®®à¯ à®ªà®¿à®©à¯à®µà®°à¯à®®à®¾à®±à¯:\n" +
                        "à®®à®©à¯à®µà®¿à®©à¯ à®µà®¿à®°à®¿à®µà®¾à®© à®µà®¿à®µà®°à®™à¯à®•à®³à¯: " + details + "\n\n" +
                        "à®Žà®©à®µà¯‡, à®Žà®©à®¤à¯ à®‡à®¨à¯à®¤ à®®à®©à¯à®µà®¿à®©à¯ˆ à®ªà®°à®¿à®šà¯€à®²à®¿à®¤à¯à®¤à¯, à®‰à®°à®¿à®¯ à®¤à¯€à®°à¯à®µà¯ à®µà®´à®™à¯à®•à¯à®®à¯à®ªà®Ÿà®¿ à®¤à®¾à®´à¯à®®à¯ˆà®¯à¯à®Ÿà®©à¯ à®•à¯‡à®Ÿà¯à®Ÿà¯à®•à¯à®•à¯Šà®³à¯à®•à®¿à®±à¯‡à®©à¯.\n\n" +
                        "à®‡à®µà®£à¯,\n" +
                        "à®¤à®™à¯à®•à®³à¯ à®‰à®£à¯à®®à¯ˆà®¯à¯à®³à¯à®³,\n\n" +
                        "(à®®à®©à¯à®¤à®¾à®°à®°à®¿à®©à¯ à®•à¯ˆà®¯à¯Šà®ªà¯à®ªà®®à¯)";
            } else {
                return "PUBLIC GRIEVANCE PETITION\n\n" +
                        "Date: " + new java.util.Date().toString() + "\n\n" +
                        "To,\n" +
                        "The District Collector / Competent Authority,\n" +
                        "[Office Name]\n" +
                        "[Address]\n\n" +
                        "1. Name of the Petitioner: [Your Name]\n" +
                        "2. Address: [Your Full Address]\n" +
                        "3. Subject of the Petition: Grievance redressal request.\n\n" +
                        "Statement of Grievance:\n" +
                        "" + details + "\n\n" +
                        "Prayer:\n" +
                        "It is respectfully requested that the authority kindly inspect the grievances mentioned above and take necessary actions to resolve the issue at the earliest.\n\n" +
                        "Yours faithfully,\n\n" +
                        "(Signature of Petitioner)";
            }
        }
    }

    // ================= AI LEGAL COPILOT =================
    public String generateLegalCopilotPlan(String problem, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);

        String systemInstruction = "You are a senior Indian legal analyst specializing in Tamil Nadu law. " +
                "Given the user's legal problem, create a comprehensive action plan. " +
                "Return ONLY a valid JSON object with exactly these keys: " +
                "\"actionPlan\" (array of strings), " +
                "\"relevantLaws\" (array of strings), " +
                "\"requiredDocuments\" (array of strings), " +
                "\"governmentOffice\" (string), " +
                "\"riskWarnings\" (array of strings), " +
                "\"estimatedTimeline\" (string). " +
                "Language: " + language + ". Return ONLY valid JSON, no extra text or markdown.";

        String response = getGeminiResponse(problem, systemInstruction, 0.4);

        if (response != null && !response.trim().isEmpty()) {
            String cleaned = cleanJsonObjectResponse(response);
            if (cleaned.contains("actionPlan")) {
                return cleaned;
            }
        }

        // Keyword-based rich fallback
        String lower = problem.toLowerCase();

        if (lower.contains("land") || lower.contains("property") || lower.contains("à®¨à®¿à®²à®®à¯") || lower.contains("à®šà¯Šà®¤à¯à®¤à¯")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "à®‰à®™à¯à®•à®³à¯ à®¨à®¿à®²à®¤à¯à®¤à®¿à®©à¯ à®…à®šà®²à¯ à®ªà®Ÿà¯à®Ÿà®¾, à®šà®¿à®Ÿà¯à®Ÿà®¾, à®…à®Ÿà®™à¯à®•à®²à¯ à®†à®µà®£à®™à¯à®•à®³à¯ˆ à®šà¯‡à®•à®°à®¿à®•à¯à®•à®µà¯à®®à¯" : "Collect original Patta, Chitta, and Adangal documents from the Tahsildar office",
                            isTamil ? "à®‰à®³à¯à®³à¯‚à®°à¯ à®µà®°à¯à®µà®¾à®¯à¯ à®†à®¯à¯à®µà®¾à®³à®°à®¿à®Ÿà®®à¯ (Revenue Inspector) à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "File a complaint with the local Revenue Inspector (RI) regarding the encroachment",
                            isTamil ? "à®šà®Ÿà¯à®Ÿ à®†à®²à¯‹à®šà®•à®°à®¿à®Ÿà®®à¯ à®¨à®¿à®² à®†à®µà®£à®™à¯à®•à®³à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯" : "Consult an advocate to verify all land title documents and check for encumbrances",
                            isTamil ? "à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®®à®¾à®µà®Ÿà¯à®Ÿ à®®à¯à®©à¯à®šà¯€à®ªà¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®¤à¯à®¤à®¿à®²à¯ à®µà®´à®•à¯à®•à¯ à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯" : "If required, file a civil suit in District Munsif Court for title declaration or injunction",
                            isTamil ? "à®‰à®¯à®°à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®¤à¯à®¤à®¿à®²à¯ à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®®à¯à®ªà¯‹à®¤à¯ à®®à¯‡à®²à¯à®®à¯à®±à¯ˆà®¯à¯€à®Ÿà¯ à®šà¯†à®¯à¯à®¯à®²à®¾à®®à¯" : "Consider appeal to High Court if lower court ruling is unfavorable"
                    },
                    new String[]{
                            isTamil ? "Tamil Nadu Land Reforms Act, 1961" : "Tamil Nadu Land Reforms (Fixation of Ceiling on Land) Act, 1961",
                            isTamil ? "Registration Act, 1908 - à®ªà®¿à®°à®¿à®µà¯ 17" : "Registration Act, 1908 - Section 17 (Compulsory Registration)",
                            isTamil ? "Transfer of Property Act, 1882" : "Transfer of Property Act, 1882",
                            isTamil ? "Specific Relief Act, 1963 - à®ªà®¿à®°à®¿à®µà¯ 34, 38" : "Specific Relief Act, 1963 - Sections 34 & 38 (Declaratory & Injunction relief)",
                            isTamil ? "Tamil Nadu Patta Chitta Act" : "Tamil Nadu Patta Passbook Act"
                    },
                    new String[]{
                            isTamil ? "à®…à®šà®²à¯ à®ªà®Ÿà¯à®Ÿà®¾ à®®à®±à¯à®±à¯à®®à¯ à®šà®¿à®Ÿà¯à®Ÿà®¾ à®¨à®•à®²à¯" : "Original Patta and Chitta copies",
                            isTamil ? "à®¨à®¿à®² à®…à®³à®µà¯€à®Ÿà¯à®Ÿà¯ à®µà®°à¯ˆà®ªà®Ÿà®®à¯ (FMB sketch)" : "FMB (Field Measurement Book) sketch",
                            isTamil ? "à®šà¯Šà®¤à¯à®¤à¯ à®µà®°à®¿ à®°à®šà¯€à®¤à¯à®•à®³à¯" : "Property tax receipts",
                            isTamil ? "à®•à®¿à®°à®¯à®ªà¯à®ªà®¤à¯à®¤à®¿à®°à®®à¯ (Sale Deed) / à®¤à®¾à®©à®ªà¯à®ªà®¤à¯à®¤à®¿à®°à®®à¯" : "Sale Deed / Gift Deed / Will document",
                            isTamil ? "Encumbrance Certificate (EC)" : "Encumbrance Certificate (EC) from Sub-Registrar office",
                            isTamil ? "à®ªà¯à®•à¯ˆà®ªà¯à®ªà®Ÿ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯" : "Photographic evidence of the land and boundary"
                    },
                    isTamil ? "à®µà®°à¯à®µà®¾à®¯à¯ à®•à¯‹à®Ÿà¯à®Ÿà®¾à®Ÿà¯à®šà®¿à®¯à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯ (RDO Office), à®®à®¾à®µà®Ÿà¯à®Ÿ à®†à®Ÿà¯à®šà®¿à®¯à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯ à®…à®²à¯à®²à®¤à¯ à®®à®¾à®µà®Ÿà¯à®Ÿ à®®à¯à®©à¯à®šà¯€à®ªà¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®®à¯" : "Revenue Divisional Officer (RDO) Office, District Collector Office, or District Munsif Court",
                    new String[]{
                            isTamil ? "à®†à®µà®£à®™à¯à®•à®³à¯ à®‡à®²à¯à®²à®¾à®®à®²à¯ à®µà®´à®•à¯à®•à¯ à®¨à®¿à®°à¯‚à®ªà®¿à®ªà¯à®ªà®¤à¯ à®•à®Ÿà®¿à®©à®®à¯ â€” à®…à®©à¯ˆà®¤à¯à®¤à¯ à®…à®šà®²à¯ à®†à®µà®£à®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®ªà®¾à®¤à¯à®•à®¾à®•à¯à®•à®µà¯à®®à¯" : "Without proper documents, proving title is very difficult â€” secure all originals immediately",
                            isTamil ? "à®‡à®Ÿà¯ˆà®•à¯à®•à®¾à®²à®¤à¯ à®¤à®Ÿà¯ˆ (Stay Order) à®‡à®²à¯à®²à®¾à®®à®²à¯ à®•à®Ÿà¯à®Ÿà¯à®®à®¾à®© à®ªà®£à®¿à®•à®³à¯ˆ à®¤à¯Šà®Ÿà®° à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯" : "Do not allow construction on disputed land without obtaining an interim stay order",
                            isTamil ? "à®•à®¾à®²à®µà®°à¯ˆà®¯à®±à¯à®± à®¤à®¾à®®à®¤à®®à¯ à®‰à®™à¯à®•à®³à¯ à®‰à®°à®¿à®®à¯ˆà®¯à¯ˆ à®ªà®¾à®¤à®¿à®•à¯à®•à®²à®¾à®®à¯ (Limitation Act 1963)" : "Delay in filing suit can extinguish rights under Limitation Act, 1963 (12-year limit)"
                    },
                    isTamil ? "à®†à®µà®£à®šà¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯: 1â€“2 à®µà®¾à®°à®™à¯à®•à®³à¯ | à®ªà¯à®•à®¾à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆ: 1â€“3 à®®à®¾à®¤à®™à¯à®•à®³à¯ | à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®¤à¯€à®°à¯à®ªà¯à®ªà¯: 1â€“5 à®†à®£à¯à®Ÿà¯à®•à®³à¯" : "Document verification: 1-2 weeks | Complaint & inquiry: 1-3 months | Court proceedings: 1-5 years"
            );
        } else if (lower.contains("salary") || lower.contains("wage") || lower.contains("à®šà®®à¯à®ªà®³à®®à¯") || lower.contains("à®Šà®¤à®¿à®¯à®®à¯")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "à®®à¯à®¤à®²à®¿à®²à¯ à®®à¯à®¤à®²à®¾à®³à®¿à®¯à®¿à®Ÿà®®à¯ à®Žà®´à¯à®¤à¯à®¤à¯à®ªà¯à®ªà¯‚à®°à¯à®µ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ à®…à®©à¯à®ªà¯à®ªà®µà¯à®®à¯" : "Send a written demand notice to your employer for pending salary",
                            isTamil ? "à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®¨à®² à®…à®²à¯à®µà®²à®•à®¤à¯à®¤à®¿à®²à¯ (Labour Office) à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "File a complaint at the District Labour Office",
                            isTamil ? "Payment of Wages Act à®•à¯€à®´à¯ Authority-à®‡à®Ÿà®®à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯" : "Apply to the Payment of Wages Authority under the Payment of Wages Act",
                            isTamil ? "à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®¨à¯€à®¤à®¿à®®à®©à¯à®±à®¤à¯à®¤à®¿à®²à¯ à®µà®´à®•à¯à®•à¯ à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯" : "Approach the Labour Court if employer fails to respond within 2 weeks"
                    },
                    new String[]{
                            "Payment of Wages Act, 1936",
                            "Minimum Wages Act, 1948",
                            "Industrial Disputes Act, 1947",
                            "Tamil Nadu Shops and Establishments Act, 1947"
                    },
                    new String[]{
                            isTamil ? "à®šà®®à¯à®ªà®³ à®¸à¯à®²à®¿à®ªà¯à®•à®³à¯ / à®ªà¯‡à®™à¯à®•à¯ à®¸à¯à®Ÿà¯‡à®Ÿà¯à®®à¯†à®©à¯à®Ÿà¯" : "Salary slips / Bank statements showing salary credits",
                            isTamil ? "à®µà¯‡à®²à¯ˆ à®¨à®¿à®¯à®®à®© à®•à®Ÿà®¿à®¤à®®à¯ (Appointment Letter)" : "Appointment letter / Employment contract",
                            isTamil ? "à®®à¯à®¤à®²à®¾à®³à®¿à®¯à®¿à®Ÿà®®à¯ à®…à®©à¯à®ªà¯à®ªà®¿à®¯ à®•à®Ÿà®¿à®¤à®™à¯à®•à®³à¯ / à®†à®¤à®¾à®°à®™à¯à®•à®³à¯" : "Copies of letters/emails sent to employer demanding payment",
                            isTamil ? "à®†à®œà®°à¯ à®ªà®¤à®¿à®µà¯‡à®Ÿà¯ à®¨à®•à®²à¯à®•à®³à¯ (Attendance Records)" : "Attendance records / Leave records"
                    },
                    isTamil ? "à®®à®¾à®µà®Ÿà¯à®Ÿ à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯ (District Labour Office) à®…à®²à¯à®²à®¤à¯ Payment of Wages Authority" : "District Labour Office or Payment of Wages Authority, Labour Court",
                    new String[]{
                            isTamil ? "1 à®µà®°à¯à®Ÿà®¤à¯à®¤à®¿à®±à¯à®•à¯à®³à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà®¿à®²à¯à®²à¯ˆ à®Žà®©à¯à®±à®¾à®²à¯ à®‰à®°à®¿à®®à¯ˆ à®•à¯à®±à¯ˆà®¯à®²à®¾à®®à¯" : "Limitation period under Payment of Wages Act is 1 year from when salary was due",
                            isTamil ? "à®µà®¾à®¯à¯à®®à¯Šà®´à®¿ à®µà®¾à®•à¯à®•à¯à®±à¯à®¤à®¿à®¯à¯ˆ à®¨à®®à¯à®ªà®¾à®¤à¯€à®°à¯à®•à®³à¯ â€” à®Žà®´à¯à®¤à¯à®¤à¯à®ªà¯à®ªà¯‚à®°à¯à®µ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯ˆ à®šà¯‡à®•à®°à®¿à®•à¯à®•à®µà¯à®®à¯" : "Never rely on verbal promises â€” ensure all employment terms are in writing"
                    },
                    isTamil ? "à®¤à¯Šà®´à®¿à®²à®¾à®³à®°à¯ à®…à®²à¯à®µà®²à®• à®µà®¿à®šà®¾à®°à®£à¯ˆ: 2â€“4 à®µà®¾à®°à®™à¯à®•à®³à¯ | à®¤à¯€à®°à¯à®µà¯: 1â€“3 à®®à®¾à®¤à®™à¯à®•à®³à¯ | à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®µà®´à®•à¯à®•à¯: 6â€“18 à®®à®¾à®¤à®™à¯à®•à®³à¯" : "Labour Office inquiry: 2-4 weeks | Settlement: 1-3 months | Court case: 6-18 months"
            );
        } else if (lower.contains("police") || lower.contains("fir") || lower.contains("complaint") || lower.contains("scam") || lower.contains("fraud") || lower.contains("à®®à¯‹à®šà®Ÿà®¿") || lower.contains("à®•à®¾à®µà®²à¯")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "à®…à®°à¯à®•à®¿à®²à¯ à®‰à®³à¯à®³ à®•à®¾à®µà®²à¯ à®¨à®¿à®²à¯ˆà®¯à®¤à¯à®¤à®¿à®²à¯ à®¨à¯‡à®°à®¿à®²à¯ FIR à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯" : "Visit the nearest police station and register an FIR (First Information Report)",
                            isTamil ? "à®•à®¾à®µà®²à®°à¯ FIR à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®¯ à®®à®±à¯à®¤à¯à®¤à®¾à®²à¯, à®®à¯‡à®²à¯à®¨à®¿à®²à¯ˆ à®…à®¤à®¿à®•à®¾à®°à®¿à®¯à®¿à®Ÿà®®à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "If police refuse to register FIR, file a written complaint to SP or approach Magistrate under Section 156(3) CrPC",
                            isTamil ? "à®¤à¯‡à®šà®¿à®¯ à®šà¯ˆà®ªà®°à¯ à®•à¯à®°à¯ˆà®®à¯ à®ªà¯‹à®°à¯à®Ÿà¯à®Ÿà®²à®¿à®²à¯ à®†à®©à¯à®²à¯ˆà®©à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯ (cybercrime.gov.in)" : "For cyber fraud/online scam, file complaint at cybercrime.gov.in",
                            isTamil ? "à®ªà¯à®•à®¾à®°à¯ à®¨à®¿à®²à¯ˆà®¯à¯ˆ à®¤à¯Šà®Ÿà®°à¯à®¨à¯à®¤à¯ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®µà¯à®®à¯" : "Track your complaint using the FIR number and follow up regularly"
                    },
                    new String[]{
                            "Indian Penal Code (IPC) Sections 406, 420 (Cheating/Fraud)",
                            "Information Technology Act, 2000 - Section 66D (Cyber Fraud)",
                            "Code of Criminal Procedure (CrPC) - Section 154, 156(3)",
                            "Tamil Nadu Protection of Interests of Depositors Act"
                    },
                    new String[]{
                            isTamil ? "à®®à¯‹à®šà®Ÿà®¿ à®ªà®±à¯à®±à®¿à®¯ à®…à®©à¯ˆà®¤à¯à®¤à¯ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯à®®à¯ (SMS, email, screenshots)" : "All evidence of the fraud (SMS, emails, screenshots, call recordings)",
                            isTamil ? "à®ªà®£ à®ªà®°à®¿à®µà®°à¯à®¤à¯à®¤à®©à¯ˆ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯ (bank statements, UPI records)" : "Bank statements / UPI transaction records / receipts",
                            isTamil ? "à®•à¯à®±à¯à®±à®µà®¾à®³à®¿à®¯à®¿à®©à¯ à®…à®Ÿà¯ˆà®¯à®¾à®³ à®¤à®•à®µà®²à¯à®•à®³à¯" : "Identity information of the accused (name, phone, address if known)",
                            isTamil ? "à®šà®¾à®Ÿà¯à®šà®¿à®•à®³à®¿à®©à¯ à®ªà¯†à®¯à®°à¯ à®®à®±à¯à®±à¯à®®à¯ à®®à¯à®•à®µà®°à®¿" : "Names and contact details of witnesses"
                    },
                    isTamil ? "à®‰à®³à¯à®³à¯‚à®°à¯ à®•à®¾à®µà®²à¯ à®¨à®¿à®²à¯ˆà®¯à®®à¯, à®®à®¾à®µà®Ÿà¯à®Ÿ à®•à®¾à®µà®²à¯ à®•à®£à¯à®•à®¾à®£à®¿à®ªà¯à®ªà®¾à®³à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯ (SP Office), à®…à®²à¯à®²à®¤à¯ cybercrime.gov.in" : "Local Police Station, District Superintendent of Police (SP) Office, or cybercrime.gov.in",
                    new String[]{
                            isTamil ? "à®šà®®à¯à®ªà®µà®®à¯ à®¨à®Ÿà®¨à¯à®¤ à®‰à®Ÿà®©à¯‡ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯ â€” à®¤à®¾à®®à®¤à®®à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆà®¯à¯ˆ à®•à®Ÿà®¿à®©à®®à®¾à®•à¯à®•à¯à®®à¯" : "File complaint immediately â€” delay weakens investigation and recovery of money",
                            isTamil ? "à®®à¯‡à®²à¯à®®à¯ à®ªà®£à®®à¯ à®…à®©à¯à®ªà¯à®ªà®µà¯‹, à®¤à®©à®¿à®ªà¯à®ªà®Ÿà¯à®Ÿ à®¤à®•à®µà®²à¯à®•à®³à¯ˆ à®ªà®•à®¿à®°à®µà¯‹ à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯" : "Do NOT send any more money or share personal/banking details with the scammer"
                    },
                    isTamil ? "FIR à®ªà®¤à®¿à®µà¯: à®‰à®Ÿà®©à®Ÿà®¿à®¯à®¾à®• | à®•à®¾à®µà®²à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆ: 2â€“8 à®µà®¾à®°à®™à¯à®•à®³à¯ | à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®µà®´à®•à¯à®•à¯: 6 à®®à®¾à®¤à®™à¯à®•à®³à¯â€“3 à®†à®£à¯à®Ÿà¯à®•à®³à¯" : "FIR registration: Immediately | Police investigation: 2-8 weeks | Court trial: 6 monthsâ€“3 years"
            );
        } else if (lower.contains("consumer") || lower.contains("product") || lower.contains("refund") || lower.contains("à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "à®µà®¿à®±à¯à®ªà®©à¯ˆà®¯à®¾à®³à®°à®¿à®Ÿà®®à¯ à®Žà®´à¯à®¤à¯à®¤à¯à®ªà¯à®ªà¯‚à®°à¯à®µà®®à®¾à®• à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "Send a formal written complaint to the seller/service provider",
                            isTamil ? "à®®à®¾à®µà®Ÿà¯à®Ÿ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®†à®£à¯ˆà®¯à®¤à¯à®¤à®¿à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "File a complaint at the District Consumer Disputes Redressal Commission",
                            isTamil ? "à®†à®©à¯à®²à¯ˆà®©à¯ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®ªà¯‹à®°à¯à®Ÿà¯à®Ÿà®²à®¿à®²à¯ (consumerhelpline.gov.in) à®ªà¯à®•à®¾à®°à¯ à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®¯à®²à®¾à®®à¯" : "File online complaint at consumerhelpline.gov.in (National Consumer Helpline - 1800-11-4000)",
                            isTamil ? "à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®µà®´à®•à¯à®•à®±à®¿à®žà®°à¯ à®‰à®¤à®µà®¿à®¯à¯à®Ÿà®©à¯ à®‡à®´à®ªà¯à®ªà¯€à®Ÿà¯ à®•à¯‹à®°à®²à®¾à®®à¯" : "Claim compensation for mental agony, deficiency in service, and product cost"
                    },
                    new String[]{
                            "Consumer Protection Act, 2019 - Section 35",
                            "Sale of Goods Act, 1930",
                            "Bureau of Indian Standards Act, 2016",
                            "E-Commerce Rules, 2020 (Consumer Protection)"
                    },
                    new String[]{
                            isTamil ? "à®ªà®¿à®²à¯ / à®‡à®©à¯à®µà®¾à®¯à¯à®¸à¯ à®¨à®•à®²à¯" : "Bill / Invoice copy",
                            isTamil ? "à®ªà¯Šà®°à¯à®³à¯ / à®šà¯‡à®µà¯ˆà®¯à®¿à®©à¯ à®•à¯à®±à¯ˆà®ªà®¾à®Ÿà¯à®Ÿà¯ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯" : "Evidence of defect/deficiency (photos, videos)",
                            isTamil ? "à®¨à®¿à®±à¯à®µà®©à®¤à¯à®¤à®¿à®Ÿà®®à¯ à®…à®©à¯à®ªà¯à®ªà®¿à®¯ à®ªà¯à®•à®¾à®°à¯ à®•à®Ÿà®¿à®¤à®™à¯à®•à®³à¯" : "Copy of complaint letters sent to the company",
                            isTamil ? "à®µà®¾à®°à®£à¯à®Ÿà®¿ / à®•à¯‡à®°à®£à¯à®Ÿà®¿ à®•à®¾à®°à¯à®Ÿà¯" : "Warranty / Guarantee card"
                    },
                    isTamil ? "à®®à®¾à®µà®Ÿà¯à®Ÿ à®¨à¯à®•à®°à¯à®µà¯‹à®°à¯ à®•à¯à®±à¯ˆà®¤à¯€à®°à¯ à®†à®£à¯ˆà®¯à®®à¯ (District Consumer Disputes Redressal Commission)" : "District Consumer Disputes Redressal Commission or National Consumer Helpline (1800-11-4000)",
                    new String[]{
                            isTamil ? "à®µà®¾à®™à¯à®•à®¿à®¯ à®¤à¯‡à®¤à®¿à®¯à®¿à®²à®¿à®°à¯à®¨à¯à®¤à¯ 2 à®†à®£à¯à®Ÿà¯à®•à®³à¯à®•à¯à®•à¯à®³à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "File complaint within 2 years from date of purchase (Limitation period)",
                            isTamil ? "à®†à®¤à®¾à®°à®™à¯à®•à®³à¯ à®‡à®²à¯à®²à®¾à®®à®²à¯ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà®¾à®®à¯" : "Do not file complaint without supporting evidence â€” it may be dismissed"
                    },
                    isTamil ? "à®ªà¯à®•à®¾à®°à¯ à®à®±à¯à®±à¯à®•à¯à®•à¯Šà®³à¯à®³à¯à®¤à®²à¯: 2â€“4 à®µà®¾à®°à®™à¯à®•à®³à¯ | à®†à®£à¯ˆà®¯à®®à¯ à®¤à¯€à®°à¯à®ªà¯à®ªà¯: 3â€“6 à®®à®¾à®¤à®™à¯à®•à®³à¯" : "Complaint acceptance: 2-4 weeks | Commission order: 3-6 months"
            );
        } else {
            // Generic fallback
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "à®‰à®™à¯à®•à®³à¯ à®šà®Ÿà¯à®Ÿ à®ªà®¿à®°à®šà¯à®šà®¿à®©à¯ˆ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®…à®©à¯ˆà®¤à¯à®¤à¯ à®†à®µà®£à®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®šà¯‡à®•à®°à®¿à®•à¯à®•à®µà¯à®®à¯" : "Gather all documents and evidence related to your legal issue",
                            isTamil ? "à®…à®°à¯à®•à®¿à®²à¯ à®‰à®³à¯à®³ à®šà®Ÿà¯à®Ÿ à®‰à®¤à®µà®¿ à®®à¯ˆà®¯à®¤à¯à®¤à¯ˆ à®…à®£à¯à®•à®µà¯à®®à¯ (Legal Aid Centre)" : "Visit the nearest Legal Aid Centre (District Legal Services Authority - DLSA)",
                            isTamil ? "à®‰à®°à®¿à®¯ à®…à®¤à®¿à®•à®¾à®°à®¿à®¯à®¿à®Ÿà®®à¯ à®Žà®´à¯à®¤à¯à®¤à¯à®ªà¯à®ªà¯‚à®°à¯à®µ à®ªà¯à®•à®¾à®°à¯ à®…à®³à®¿à®•à¯à®•à®µà¯à®®à¯" : "File a formal written complaint with the appropriate authority",
                            isTamil ? "à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯ à®µà®´à®•à¯à®•à®±à®¿à®žà®°à¯ à®†à®²à¯‹à®šà®©à¯ˆ à®ªà¯†à®±à®µà¯à®®à¯" : "Consult an advocate for legal advice specific to your situation",
                            isTamil ? "RTI à®®à¯‚à®²à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà¯à®Ÿà¯ˆà®¯ à®…à®°à®šà¯ à®¤à®•à®µà®²à¯à®•à®³à¯ˆ à®ªà¯†à®±à®²à®¾à®®à¯" : "Use RTI (Right to Information Act) to obtain relevant government records"
                    },
                    new String[]{
                            "Indian Constitution - Fundamental Rights (Articles 12-35)",
                            "Legal Services Authorities Act, 1987 (Free Legal Aid)",
                            "Right to Information Act, 2005",
                            "Code of Civil Procedure, 1908"
                    },
                    new String[]{
                            isTamil ? "à®…à®Ÿà¯ˆà®¯à®¾à®³ à®†à®µà®£à®™à¯à®•à®³à¯ (Aadhaar, PAN)" : "Identity documents (Aadhaar card, PAN card)",
                            isTamil ? "à®ªà®¿à®°à®šà¯à®šà®¿à®©à¯ˆ à®¤à¯Šà®Ÿà®°à¯à®ªà®¾à®© à®…à®©à¯ˆà®¤à¯à®¤à¯ à®Žà®´à¯à®¤à¯à®¤à¯à®ªà¯à®ªà¯‚à®°à¯à®µ à®†à®¤à®¾à®°à®™à¯à®•à®³à¯" : "All written evidence and correspondence related to the issue",
                            isTamil ? "à®šà®¾à®Ÿà¯à®šà®¿à®•à®³à®¿à®©à¯ à®¤à®•à®µà®²à¯à®•à®³à¯" : "Witness details (if any)",
                            isTamil ? "à®¨à®¿à®¤à®¿ à®ªà®°à®¿à®µà®°à¯à®¤à¯à®¤à®©à¯ˆ à®ªà®¤à®¿à®µà¯à®•à®³à¯ (à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®Ÿà®¾à®²à¯)" : "Financial transaction records (if applicable)"
                    },
                    isTamil ? "à®®à®¾à®µà®Ÿà¯à®Ÿ à®šà®Ÿà¯à®Ÿ à®šà¯‡à®µà¯ˆ à®†à®£à¯ˆà®¯à®®à¯ (DLSA), à®®à®¾à®µà®Ÿà¯à®Ÿ à®†à®Ÿà¯à®šà®¿à®¯à®°à¯ à®…à®²à¯à®µà®²à®•à®®à¯" : "District Legal Services Authority (DLSA), District Collector Office, or relevant government department",
                    new String[]{
                            isTamil ? "à®•à®¾à®²à®µà®°à¯ˆà®¯à®±à¯à®± à®¤à®¾à®®à®¤à®®à¯ à®‰à®™à¯à®•à®³à¯ à®šà®Ÿà¯à®Ÿ à®‰à®°à®¿à®®à¯ˆà®¯à¯ˆ à®ªà®¾à®¤à®¿à®•à¯à®•à®²à®¾à®®à¯" : "Delayed action may affect your legal rights under the Limitation Act",
                            isTamil ? "à®¤à®•à¯à®¤à®¿à®¯à®±à¯à®± à®®à®¤à¯à®¤à®¿à®¯à®¸à¯à®¤à®°à¯à®•à®³à¯ˆ à®¨à®®à¯à®ªà®¾à®¤à¯€à®°à¯à®•à®³à¯" : "Beware of unauthorized intermediaries who claim to resolve legal issues for money"
                    },
                    isTamil ? "à®†à®²à¯‹à®šà®©à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®†à®µà®£ à®¤à®¯à®¾à®°à®¿à®ªà¯à®ªà¯: 1â€“2 à®µà®¾à®°à®™à¯à®•à®³à¯ | à®ªà¯à®•à®¾à®°à¯ à®µà®¿à®šà®¾à®°à®£à¯ˆ: 1â€“3 à®®à®¾à®¤à®™à¯à®•à®³à¯ | à®¨à¯€à®¤à®¿à®®à®©à¯à®± à®¤à¯€à®°à¯à®µà¯: 6 à®®à®¾à®¤à®™à¯à®•à®³à¯â€“3 à®†à®£à¯à®Ÿà¯à®•à®³à¯" : "Consultation & documentation: 1-2 weeks | Complaint inquiry: 1-3 months | Court resolution: 6 monthsâ€“3 years"
            );
        }
    }

    private String buildCopilotJson(boolean isTamil, String[] actionPlan, String[] relevantLaws,
                                     String[] requiredDocuments, String governmentOffice,
                                     String[] riskWarnings, String estimatedTimeline) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"actionPlan\":[");
        for (int i = 0; i < actionPlan.length; i++) {
            sb.append("\"").append(actionPlan[i].replace("\"", "\\\"")).append("\"");
            if (i < actionPlan.length - 1) sb.append(",");
        }
        sb.append("],");
        sb.append("\"relevantLaws\":[");
        for (int i = 0; i < relevantLaws.length; i++) {
            sb.append("\"").append(relevantLaws[i].replace("\"", "\\\"")).append("\"");
            if (i < relevantLaws.length - 1) sb.append(",");
        }
        sb.append("],");
        sb.append("\"requiredDocuments\":[");
        for (int i = 0; i < requiredDocuments.length; i++) {
            sb.append("\"").append(requiredDocuments[i].replace("\"", "\\\"")).append("\"");
            if (i < requiredDocuments.length - 1) sb.append(",");
        }
        sb.append("],");
        sb.append("\"governmentOffice\":\"").append(governmentOffice.replace("\"", "\\\"")).append("\",");
        sb.append("\"riskWarnings\":[");
        for (int i = 0; i < riskWarnings.length; i++) {
            sb.append("\"").append(riskWarnings[i].replace("\"", "\\\"")).append("\"");
            if (i < riskWarnings.length - 1) sb.append(",");
        }
        sb.append("],");
        sb.append("\"estimatedTimeline\":\"").append(estimatedTimeline.replace("\"", "\\\"")).append("\"");
        sb.append("}");
        return sb.toString();
    }
}
