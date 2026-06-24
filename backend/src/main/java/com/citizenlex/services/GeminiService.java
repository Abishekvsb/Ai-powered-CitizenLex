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

    // ================= LEGAL COPILOT API =================
    public String generateLegalCopilotPlan(String problem, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        String systemInstruction = "You are an expert Indian Legal Assistant. Analyze the user's legal problem and return a structured JSON response. " +
                "The response must be in " + (isTamil ? "Tamil" : "English") + ". " +
                "You must return ONLY a JSON object. Do not include markdown code block formatting (like ```json ... ```). Return raw JSON. " +
                "The JSON object must have exactly these keys: " +
                "actionPlan (array of strings, detailing step-by-step actions), " +
                "relevantLaws (array of strings, naming relevant legal sections/acts), " +
                "requiredDocuments (array of strings, detailing required papers/proofs), " +
                "governmentOffice (string, the government body or authority to contact), " +
                "riskWarnings (array of strings, warning about potential risks/delays), " +
                "estimatedTimeline (string, estimated duration).";

        String prompt = "Analyze this problem: " + problem;
        String response = getGeminiResponse(prompt, systemInstruction, 0.4);

        if (response != null && !response.trim().isEmpty()) {
            String cleaned = cleanJsonObjectResponse(response);
            if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
                return cleaned;
            }
        }

        return generateFallbackCopilotPlan(problem, language);
    }

    private String generateFallbackCopilotPlan(String problem, String language) {
        boolean isTamil = "ta".equalsIgnoreCase(language);
        String probLower = problem.toLowerCase();

        if (probLower.contains("land") || probLower.contains("நிலம்") || probLower.contains("property")) {
            if (isTamil) {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. நிலத்தின் தற்போதைய பட்டா, சிட்டா மற்றும் அடங்கல் நகல்களை இணையதளத்தில் இருந்து சரிபார்க்கவும்.\"," +
                        "\"2. உள்ளூர் வட்டாட்சியர் (Tahsildar) அலுவலகத்தில் நில அளவீடு செய்ய மனு அளிக்கவும்.\"," +
                        "\"3. ஏதேனும் அத்துமீறல் இருந்தால், காவல் நிலையத்தில் எல்லை தகராறு தொடர்பாக புகார் அளிக்கவும்.\"," +
                        "\"4. தேவைப்படின், மாவட்ட வருவாய் அலுவலர் (DRO) அல்லது உரிமையியல் நீதிமன்றத்தை அணுகவும்.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"தமிழ்நாடு நில சீர்திருத்தச் சட்டம்\"," +
                        "\"இந்திய தண்டனைச் சட்டம் பிரிவு 447 (அத்துமீறல்)\"," +
                        "\"உரிமையியல் நடைமுறைச் சட்டம் (Civil Procedure Code) பிரிவு 9\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"அசல் நில கிரையப் பத்திரம் (Sale Deed)\"," +
                        "\"தற்போதைய பட்டா & வில்லங்கச் சான்றிதழ் (EC)\"," +
                        "\"அடையாளச் சான்று (ஆதார் அட்டை)\"" +
                    "]," +
                    "\"governmentOffice\":\"உள்ளூர் வட்டாட்சியர் அலுவலகம் (Tahsildar Office) அல்லது மாவட்ட ஆட்சியர் அலுவலகம்\"," +
                    "\"riskWarnings\":[" +
                        "\"நில தகராறுகளுக்கு சிவில் வழக்கு தொடர்ந்தால் தீர்வு கிடைக்க நீண்ட காலம் ஆகலாம்.\"," +
                        "\"போலி ஆவணங்கள் மூலம் மோசடி நடந்திருந்தால் காவல்துறை நடவடிக்கை அவசியமாகும்.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"3 முதல் 12 மாதங்கள் (அதிகாரிகளின் நடவடிக்கையைப் பொறுத்து)\"" +
                    "}";
            } else {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. Verify current land details (Patta, Chitta, Adangal) online through the Anyal/Patta portal.\"," +
                        "\"2. Submit an application for surveyor measurement at the local Tahsildar office.\"," +
                        "\"3. Lodge a police complaint in case of criminal trespass or physical threats.\"," +
                        "\"4. If dispute is unresolved by revenue authorities, file an injunction suit in civil court.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"Section 447 of IPC (Criminal Trespass)\"," +
                        "\"Section 9 of Civil Procedure Code (CPC)\"," +
                        "\"Tamil Nadu Patta Passbook Act, 1983\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"Original Sale Deed / Title Deed\"," +
                        "\"Encumbrance Certificate (EC) for past 30 years\"," +
                        "\"Patta Copy & Land Map (FMB sketch)\"" +
                    "]," +
                    "\"governmentOffice\":\"Local Tahsildar Office / Revenue Department / Civil Court\"," +
                    "\"riskWarnings\":[" +
                        "\"Civil property disputes can take several years in court.\"," +
                        "\"Ensure boundary measurements are done by official government surveyors only.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"3 to 12 months depending on administrative and court timelines\"" +
                    "}";
            }
        } else if (probLower.contains("scam") || probLower.contains("மோசடி") || probLower.contains("cheat") || probLower.contains("cyber")) {
            if (isTamil) {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. சைபர் கிரைம் இணையதளத்தில் (cybercrime.gov.in) உடனடியாக ஆன்லைன் புகார் பதிவு செய்யவும்.\"," +
                        "\"2. வங்கி கணக்கு/அட்டை விவரங்கள் திருடப்பட்டிருந்தால், வங்கியைத் தொடர்பு கொண்டு கணக்கை முடக்கவும்.\"," +
                        "\"3. அனைத்து பணப்பரிவர்த்தனை ஆதாரங்கள், குறுஞ்செய்திகள் மற்றும் ஸ்கிரீன்ஷாட்களை சேமிக்கவும்.\"," +
                        "\"4. உள்ளூர் காவல் நிலைய சைபர் பிரிவில் முறையான புகார் மனுவை சமர்ப்பிக்கவும்.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"தகவல் தொழில்நுட்பச் சட்டம் (IT Act) பிரிவு 66D\"," +
                        "\"இந்திய தண்டனைச் சட்டம் பிரிவு 420 (ஏமாற்றுதல்)\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"வங்கி கணக்கு அறிக்கை (Bank Statement)\"," +
                        "\"மோசடி பரிவர்த்தனை ரசீது அல்லது Transaction ID\"," +
                        "\"சம்பந்தப்பட்ட குறுஞ்செய்தி & அழைப்பு பதிவுகள் (Call Logs)\"" +
                    "]," +
                    "\"governmentOffice\":\"சைபர் கிரைம் காவல் பிரிவு (Cyber Crime Cell) மற்றும் உங்கள் வங்கி கிளை\"," +
                    "\"riskWarnings\":[" +
                        "\"சைபர் மோசடிகளில் முதல் 24 மணி நேரத்திற்குள் (Golden Hour) புகார் அளிப்பது பணத்தை மீட்க உதவும்.\"," +
                        "\"அடையாளம் தெரியாத நபர்களிடம் OTP அல்லது கடவுச்சொல்லை பகிர வேண்டாம்.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"1 முதல் 3 மாதங்கள் (புலனாய்வைப் பொறுத்து)\"" +
                    "}";
            } else {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. Report the financial scam immediately on the National Cyber Crime Portal (cybercrime.gov.in) or call 1930.\"," +
                        "\"2. Contact your bank immediately to freeze compromised bank accounts or cards.\"," +
                        "\"3. Gather screenshots of chats, fake websites, transaction receipts, and phone numbers.\"," +
                        "\"4. Submit a written complaint to the cyber cell of your local police station.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"Section 66D of Information Technology Act (Cheating by Personation)\"," +
                        "\"Section 420 of IPC (Cheating and Dishonestly Inducing Delivery of Property)\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"Bank statement highlighting the fraudulent transaction(s)\"," +
                        "\"Screenshots of fraudulent communications / SMS / WhatsApp messages\"," +
                        "\"Copy of Cyber Crime Complaint ACK receipt\"" +
                    "]," +
                    "\"governmentOffice\":\"National Cyber Crime Cell / Local Police Cyber Division\"," +
                    "\"riskWarnings\":[" +
                        "\"Speed is critical; reporting within 24 hours increases chances of reversing payments.\"," +
                        "\"Police will never ask for payment/OTP to resolve a scam investigation.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"1 to 3 months depending on transaction tracking\"" +
                    "}";
            }
        } else if (probLower.contains("salary") || probLower.contains("சம்பளம்") || probLower.contains("wage") || probLower.contains("job")) {
            if (isTamil) {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. நிலுவைச் சம்பளத்தை உடனே வழங்கக் கோரி நிறுவனத்திற்கு முறையான மின்னஞ்சல் அல்லது கடிதம் அனுப்பவும்.\"," +
                        "\"2. வேலை ஒப்பந்தப் பத்திரம் மற்றும் சம்பளப் பட்டியலைச் சரிபார்க்கவும்.\"," +
                        "\"3. தீர்வு கிடைக்காவிடில், மாவட்ட தொழிலாளர் ஆணையர் (Labour Commissioner) அலுவலகத்தில் புகார் அளிக்கவும்.\"," +
                        "\"4. சிவில் நீதிமன்றத்தில் நிலுவைத் தொகை கோரி வழக்கு தொடரலாம்.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"சம்பள வழங்கீட்டுச் சட்டம் 1936 (Payment of Wages Act)\"," +
                        "\"தொழில்தகராறுகள் சட்டம் 1947 (Industrial Disputes Act)\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"பணி நியமனக் கடிதம் (Offer Letter / Appointment Letter)\"," +
                        "\"சம்பளச் சீட்டு (Salary Slips) மற்றும் வங்கி கணக்கு அறிக்கை\"," +
                        "\"வேலை செய்த நாட்களுக்கான ஆதாரங்கள் (Attendance records)\"" +
                    "]," +
                    "\"governmentOffice\":\"மாவட்ட தொழிலாளர் நல வாரியம் / தொழிலாளர் ஆணையர் அலுவலகம்\"," +
                    "\"riskWarnings\":[" +
                        "\"நிறுவனம் திவாலாகி இருந்தால், ஊதியம் பெறுவதில் சட்ட ரீதியான சிக்கல்கள் ஏற்படலாம்.\"," +
                        "\"தொழிலாளர் நீதிமன்றங்களில் வழக்கு விசாரணை முடிய சில மாதங்கள் ஆகலாம்.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"2 முதல் 6 மாதங்கள்\"" +
                    "}";
            } else {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. Send a formal written demand notice to the employer requesting payment of unpaid wages within a specific deadline (e.g., 15 days).\"," +
                        "\"2. Review employment contract clauses regarding notice periods and termination payouts.\"," +
                        "\"3. File an official complaint with the local Labour Commissioner or Conciliation Officer.\"," +
                        "\"4. If conciliation fails, raise an industrial dispute in the Labour Court.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"Payment of Wages Act, 1936\"," +
                        "\"Industrial Disputes Act, 1947\"," +
                        "\"Shops and Establishments Act (State-specific)\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"Employment Agreement or Appointment Letter\"," +
                        "\"Bank statement proving non-payment of salary\"," +
                        "\"Emails, attendance records, or task logs confirming days worked\"" +
                    "]," +
                    "\"governmentOffice\":\"Office of the Labour Commissioner / Labour Court / Civil Court\"," +
                    "\"riskWarnings\":[" +
                        "\"Ensure all demand letters are sent via registered post or tracked email.\"," +
                        "\"Informal contracts or cash payments are harder to prove in labour forums.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"2 to 6 months through conciliation and labor commissioner processes\"" +
                    "}";
            }
        } else {
            // Default Consumer Complaint/General Plan
            if (isTamil) {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. தவறு அல்லது சேவையின் குறைபாடு குறித்து சம்பந்தப்பட்ட நிறுவனத்திற்கு முறையான புகார் அனுப்பவும்.\"," +
                        "\"2. குறைதீர்வு காணப்படாவிட்டால், நுகர்வோர் குறைதீர் ஆணையத்தில் மின்-தாக்கல் (E-Daakhil) மூலம் புகார் அளிக்கவும்.\"," +
                        "\"3. வழக்கு தொடர்பான அனைத்து ஆதாரங்கள், ரசீதுகள் மற்றும் கடிதப் பரிமாற்றங்களை தயார் செய்யவும்.\"," +
                        "\"4. நுகர்வோர் நீதிமன்ற விசாரணையில் நேரடியாகவோ அல்லது வழக்கறிஞர் மூலமாகவோ ஆஜராகவும்.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"நுகர்வோர் பாதுகாப்புச் சட்டம் 2019 (Consumer Protection Act)\"," +
                        "\"இந்திய ஒப்பந்தச் சட்டம் 1872 (Indian Contract Act)\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"பொருள் வாங்கியதற்கான அசல் ரசீது (Purchase Invoice / Bill)\"," +
                        "\"உத்தரவாத அட்டை (Warranty Card) மற்றும் குறைபாடுள்ள தயாரிப்பின் புகைப்படங்கள்\"," +
                        "\"நிறுவனத்திற்கு அனுப்பிய மின்னஞ்சல்கள் / புகார்களின் நகல்\"" +
                    "]," +
                    "\"governmentOffice\":\"மாவட்ட நுகர்வோர் குறைதீர் ஆணையம் (District Consumer Forum) / E-Daakhil Portal\"," +
                    "\"riskWarnings\":[" +
                        "\"புகார் வாங்கிய 2 ஆண்டுகளுக்குள் நீதிமன்றத்தில் தாக்கல் செய்யப்பட வேண்டும்.\"," +
                        "\"கோரிக்கைகள் தவறானது என நிரூபிக்கப்பட்டால் நுகர்வோருக்கு அபராதம் விதிக்கப்படலாம்.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"3 முதல் 9 மாதங்கள்\"" +
                    "}";
            } else {
                return "{" +
                    "\"actionPlan\":[" +
                        "\"1. Send a formal written grievance to the vendor/company regarding the service deficiency or product defect.\"," +
                        "\"2. If no satisfactory reply is received, file a complaint on the National Consumer Helpline (NCH) or via the E-Daakhil portal.\"," +
                        "\"3. Compile all bills, warranty cards, service receipts, and communication logs.\"," +
                        "\"4. Represent your case at the District Consumer Disputes Redressal Commission.\"" +
                    "]," +
                    "\"relevantLaws\":[" +
                        "\"Consumer Protection Act, 2019\"," +
                        "\"Sale of Goods Act, 1930\"," +
                        "\"Indian Contract Act, 1872\"" +
                    "]," +
                    "\"requiredDocuments\":[" +
                        "\"Retail Invoice / Cash Memo showing purchase details\"," +
                        "\"Warranty/Guarantee card and service reports\"," +
                        "\"Written correspondences or email threads with the seller/manufacturer\"" +
                    "]," +
                    "\"governmentOffice\":\"District Consumer Disputes Redressal Commission / National Consumer Helpline\"," +
                    "\"riskWarnings\":[" +
                        "\"Consumer complaints must be filed within 2 years of the cause of action.\"," +
                        "\"Make sure to name both the retailer and manufacturer in the petition if necessary.\"" +
                    "]," +
                    "\"estimatedTimeline\":\"3 to 9 months for resolution in consumer commissions\"" +
                    "}";
            }
        }
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
                return "தகவல் அறியும் உரிமைச் சட்டம் 2005, பிரிவு 6(1)-ன் கீழ் விண்ணப்பம்\n\n" +
                        "தேதி: " + new java.util.Date().toString() + "\n\n" +
                        "பெறுநர்:\n" +
                        "பொதுத் தகவல் அலுவலர் அவர்கள்,\n" +
                        "[அலுவலக முகவரி]\n\n" +
                        "மனுதாரர்:\n" +
                        "[உங்கள் பெயர் மற்றும் முகவரி]\n\n" +
                        "பொருள்: தகவல் அறியும் உரிமைச் சட்டம் 2005-ன் கீழ் தகவல் வேண்டுதல் - சார்பு.\n\n" +
                        "விவரங்கள்:\n" +
                        "மனுதாரர் கோரும் தகவல்கள் பின்வருமாறு:\n" +
                        "1. [கோரப்படும் தகவல் 1 - விவரம்]\n" +
                        "2. [கோரப்படும் தகவல் 2 - விவரம்]\n" +
                        "பயனர் வழங்கிய வழக்கு விவரங்கள்: " + details + "\n\n" +
                        "விண்ணப்பக் கட்டணம்:\n" +
                        "ரூ.10/- க்கான நீதிமன்ற வில்லை (Court Fee Stamp) ஒட்டப்பட்டுள்ளது / அல்லது டிமாண்ட் டிராப்ட் இணைக்கப்பட்டுள்ளது.\n\n" +
                        "இவண்,\n" +
                        "தங்கள் உண்மையுள்ள,\n\n" +
                        "(மனுதாரரின் கையொப்பம்)";
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
                return "மாவட்ட நுகர்வோர் குறைதீர் ஆணையம் முன்\n\n" +
                        "தேதி: " + new java.util.Date().toString() + "\n\n" +
                        "புகார்தாரர்:\n" +
                        "[உங்கள் பெயர் மற்றும் முகவரி]\n\n" +
                        "எதிர்மனுதாரர்:\n" +
                        "[நிறுவனம்/விற்பனையாளர் பெயர் மற்றும் முகவரி]\n\n" +
                        "பொருள்: நுகர்வோர் பாதுகாப்புச் சட்டம், 2019-ன் கீழ் நுகர்வோர் புகார் மனு.\n\n" +
                        "புகாரின் விவரங்கள்:\n" +
                        "1. புகார்தாரராகிய நான் எதிர்மனுதாரரிடம் இருந்து [பொருள்/சேவை] வாங்கினேன்.\n" +
                        "2. பயனர் வழங்கிய வழக்கு விவரங்கள்: " + details + "\n" +
                        "3. இதனால் எனக்கு ஏற்பட்ட நஷ்டம் மற்றும் மன உளைச்சலுக்கு எதிர்மனுதாரர் பொறுப்பேற்க வேண்டும்.\n\n" +
                        "வேண்டுதல் (Prayer):\n" +
                        "எனவே, இந்த மாண்புமிகு நுகர்வோர் குறைதீர் ஆணையம் எனக்கு ஏற்பட்ட இழப்பிற்கு தகுந்த இழப்பீடு பெற்றுத் தரும்படி பணிவுடன் கேட்டுக்கொள்கிறேன்.\n\n" +
                        "இவண்,\n" +
                        "தங்கள் உண்மையுள்ள,\n\n" +
                        "(புகார்தாரர் கையொப்பம்)";
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
                return "காவல் நிலைய புகார் மனு\n\n" +
                        "தேதி: " + new java.util.Date().toString() + "\n" +
                        "இடம்: [இடம்]\n\n" +
                        "பெறுநர்:\n" +
                        "காவல் நிலைய ஆய்வாளர் அவர்கள்,\n" +
                        "[காவல் நிலைய முகவரி]\n\n" +
                        "புகார்தாரர்:\n" +
                        "[உங்கள் பெயர், தந்தை பெயர், முகவரி]\n\n" +
                        "பொருள்: குற்றவியல் புகார் மற்றும் சட்ட நடவடிக்கை வேண்டுதல் - சார்பு.\n\n" +
                        "புகாரின் விவரங்கள்:\n" +
                        "ஐயா/அம்மா, எனது புகார் விவரம் பின்வருமாறு:\n" +
                        "பயனர் வழங்கிய சம்பவ விவரங்கள்: " + details + "\n\n" +
                        "எனவே, தயவுசெய்து எனது புகாரைப் பெற்றுக்கொண்டு, சம்பந்தப்பட்ட நபர்கள் மீது சட்டப்படி நடவடிக்கை எடுத்து, எனக்கு நீதி வழங்கும்படி கேட்டுக்கொள்கிறேன்.\n\n" +
                        "இவண்,\n" +
                        "தங்கள் உண்மையுள்ள,\n\n" +
                        "(புகார்தாரரின் கையொப்பம்)";
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
                return "வழக்கறிஞர் சட்ட அறிவிப்பு (LEGAL NOTICE)\n\n" +
                        "தேதி: " + new java.util.Date().toString() + "\n\n" +
                        "பெறுநர்:\n" +
                        "[எதிர் தரப்பினரின் பெயர் மற்றும் முகவரி]\n\n" +
                        "எனது கிளையண்ட் [உங்கள் பெயர் மற்றும் முகவரி] என்பவரின் அறிவுறுத்தலின்படி தங்களுக்கு அனுப்பும் சட்ட அறிவிப்பு:\n\n" +
                        "வழக்கின் பின்னணி விவரங்கள்:\n" +
                        "1. பயனர் வழங்கிய விவரங்கள்: " + details + "\n" +
                        "2. இந்த அறிவிப்பு கிடைத்த 15 நாட்களுக்குள் தாங்கள் என் கிளையண்டிற்கு உரிய தீர்வு வழங்க வேண்டும்.\n" +
                        "3. தவறினால், சிவில் மற்றும் கிரிமினல் சட்டங்களின் கீழ் நீதிமன்றத்தில் வழக்கு தொடரப்படும் என்பதை தெரிவித்துக் கொள்கிறேன்.\n\n" +
                        "வழக்கறிஞரின் கையொப்பம்\n\n" +
                        "(சட்ட ஆலோசகர்)";
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
                return "பொது மக்கள் குறைதீர் மனு\n\n" +
                        "தேதி: " + new java.util.Date().toString() + "\n\n" +
                        "பெறுநர்:\n" +
                        "மாவட்ட ஆட்சியர் அவர்கள் / தகுதிவாய்ந்த அதிகாரி,\n" +
                        "[அலுவலக முகவரி]\n\n" +
                        "மனுதாரர்:\n" +
                        "[உங்கள் பெயர் மற்றும் முகவரி]\n\n" +
                        "பொருள்: [மனுவின் தலைப்பு] - குறைதீர் நடவடிக்கை கோருதல் - சார்பு.\n\n" +
                        "மனு விவரங்கள்:\n" +
                        "ஐயா/அம்மா, நான் தங்களுக்கு சமர்ப்பிக்கும் கோரிக்கை மனு விவரம் பின்வருமாறு:\n" +
                        "மனுவின் விரிவான விவரங்கள்: " + details + "\n\n" +
                        "எனவே, எனது இந்த மனுவினை பரிசீலித்து, உரிய தீர்வு வழங்கும்படி தாழ்மையுடன் கேட்டுக்கொள்கிறேன்.\n\n" +
                        "இவண்,\n" +
                        "தங்கள் உண்மையுள்ள,\n\n" +
                        "(மனுதாரரின் கையொப்பம்)";
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

        if (lower.contains("land") || lower.contains("property") || lower.contains("நிலம்") || lower.contains("சொத்து")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "உங்கள் நிலத்தின் அசல் பட்டா, சிட்டா, அடங்கல் ஆவணங்களை சேகரிக்கவும்" : "Collect original Patta, Chitta, and Adangal documents from the Tahsildar office",
                            isTamil ? "உள்ளூர் வருவாய் ஆய்வாளரிடம் (Revenue Inspector) புகார் அளிக்கவும்" : "File a complaint with the local Revenue Inspector (RI) regarding the encroachment",
                            isTamil ? "சட்ட ஆலோசகரிடம் நில ஆவணங்களை சரிபார்க்கவும்" : "Consult an advocate to verify all land title documents and check for encumbrances",
                            isTamil ? "தேவைப்பட்டால் மாவட்ட முன்சீப் நீதிமன்றத்தில் வழக்கு தொடரவும்" : "If required, file a civil suit in District Munsif Court for title declaration or injunction",
                            isTamil ? "உயர் நீதிமன்றத்தில் தேவைப்படும்போது மேல்முறையீடு செய்யலாம்" : "Consider appeal to High Court if lower court ruling is unfavorable"
                    },
                    new String[]{
                            isTamil ? "Tamil Nadu Land Reforms Act, 1961" : "Tamil Nadu Land Reforms (Fixation of Ceiling on Land) Act, 1961",
                            isTamil ? "Registration Act, 1908 - பிரிவு 17" : "Registration Act, 1908 - Section 17 (Compulsory Registration)",
                            isTamil ? "Transfer of Property Act, 1882" : "Transfer of Property Act, 1882",
                            isTamil ? "Specific Relief Act, 1963 - பிரிவு 34, 38" : "Specific Relief Act, 1963 - Sections 34 & 38 (Declaratory & Injunction relief)",
                            isTamil ? "Tamil Nadu Patta Chitta Act" : "Tamil Nadu Patta Passbook Act"
                    },
                    new String[]{
                            isTamil ? "அசல் பட்டா மற்றும் சிட்டா நகல்" : "Original Patta and Chitta copies",
                            isTamil ? "நில அளவீட்டு வரைபடம் (FMB sketch)" : "FMB (Field Measurement Book) sketch",
                            isTamil ? "சொத்து வரி ரசீதுகள்" : "Property tax receipts",
                            isTamil ? "கிரயப்பத்திரம் (Sale Deed) / தானப்பத்திரம்" : "Sale Deed / Gift Deed / Will document",
                            isTamil ? "Encumbrance Certificate (EC)" : "Encumbrance Certificate (EC) from Sub-Registrar office",
                            isTamil ? "புகைப்பட ஆதாரங்கள்" : "Photographic evidence of the land and boundary"
                    },
                    isTamil ? "வருவாய் கோட்டாட்சியர் அலுவலகம் (RDO Office), மாவட்ட ஆட்சியர் அலுவலகம் அல்லது மாவட்ட முன்சீப் நீதிமன்றம்" : "Revenue Divisional Officer (RDO) Office, District Collector Office, or District Munsif Court",
                    new String[]{
                            isTamil ? "ஆவணங்கள் இல்லாமல் வழக்கு நிரூபிப்பது கடினம் — அனைத்து அசல் ஆவணங்களையும் பாதுகாக்கவும்" : "Without proper documents, proving title is very difficult — secure all originals immediately",
                            isTamil ? "இடைக்காலத் தடை (Stay Order) இல்லாமல் கட்டுமான பணிகளை தொடர வேண்டாம்" : "Do not allow construction on disputed land without obtaining an interim stay order",
                            isTamil ? "காலவரையற்ற தாமதம் உங்கள் உரிமையை பாதிக்கலாம் (Limitation Act 1963)" : "Delay in filing suit can extinguish rights under Limitation Act, 1963 (12-year limit)"
                    },
                    isTamil ? "ஆவணச் சரிபார்ப்பு: 1–2 வாரங்கள் | புகார் மற்றும் விசாரணை: 1–3 மாதங்கள் | நீதிமன்ற தீர்ப்பு: 1–5 ஆண்டுகள்" : "Document verification: 1-2 weeks | Complaint & inquiry: 1-3 months | Court proceedings: 1-5 years"
            );
        } else if (lower.contains("salary") || lower.contains("wage") || lower.contains("சம்பளம்") || lower.contains("ஊதியம்")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "முதலில் முதலாளியிடம் எழுத்துப்பூர்வ கோரிக்கை அனுப்பவும்" : "Send a written demand notice to your employer for pending salary",
                            isTamil ? "தொழிலாளர் நல அலுவலகத்தில் (Labour Office) புகார் அளிக்கவும்" : "File a complaint at the District Labour Office",
                            isTamil ? "Payment of Wages Act கீழ் Authority-இடம் விண்ணப்பிக்கவும்" : "Apply to the Payment of Wages Authority under the Payment of Wages Act",
                            isTamil ? "தேவைப்பட்டால் தொழிலாளர் நீதிமன்றத்தில் வழக்கு தொடரவும்" : "Approach the Labour Court if employer fails to respond within 2 weeks"
                    },
                    new String[]{
                            "Payment of Wages Act, 1936",
                            "Minimum Wages Act, 1948",
                            "Industrial Disputes Act, 1947",
                            "Tamil Nadu Shops and Establishments Act, 1947"
                    },
                    new String[]{
                            isTamil ? "சம்பள ஸ்லிப்கள் / பேங்க் ஸ்டேட்மென்ட்" : "Salary slips / Bank statements showing salary credits",
                            isTamil ? "வேலை நியமன கடிதம் (Appointment Letter)" : "Appointment letter / Employment contract",
                            isTamil ? "முதலாளியிடம் அனுப்பிய கடிதங்கள் / ஆதாரங்கள்" : "Copies of letters/emails sent to employer demanding payment",
                            isTamil ? "ஆஜர் பதிவேடு நகல்கள் (Attendance Records)" : "Attendance records / Leave records"
                    },
                    isTamil ? "மாவட்ட தொழிலாளர் அலுவலகம் (District Labour Office) அல்லது Payment of Wages Authority" : "District Labour Office or Payment of Wages Authority, Labour Court",
                    new String[]{
                            isTamil ? "1 வருடத்திற்குள் புகார் அளிக்கவில்லை என்றால் உரிமை குறையலாம்" : "Limitation period under Payment of Wages Act is 1 year from when salary was due",
                            isTamil ? "வாய்மொழி வாக்குறுதியை நம்பாதீர்கள் — எழுத்துப்பூர்வ ஆதாரங்களை சேகரிக்கவும்" : "Never rely on verbal promises — ensure all employment terms are in writing"
                    },
                    isTamil ? "தொழிலாளர் அலுவலக விசாரணை: 2–4 வாரங்கள் | தீர்வு: 1–3 மாதங்கள் | நீதிமன்ற வழக்கு: 6–18 மாதங்கள்" : "Labour Office inquiry: 2-4 weeks | Settlement: 1-3 months | Court case: 6-18 months"
            );
        } else if (lower.contains("police") || lower.contains("fir") || lower.contains("complaint") || lower.contains("scam") || lower.contains("fraud") || lower.contains("மோசடி") || lower.contains("காவல்")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "அருகில் உள்ள காவல் நிலையத்தில் நேரில் FIR பதிவு செய்யவும்" : "Visit the nearest police station and register an FIR (First Information Report)",
                            isTamil ? "காவலர் FIR பதிவு செய்ய மறுத்தால், மேல்நிலை அதிகாரியிடம் புகார் அளிக்கவும்" : "If police refuse to register FIR, file a written complaint to SP or approach Magistrate under Section 156(3) CrPC",
                            isTamil ? "தேசிய சைபர் க்ரைம் போர்ட்டலில் ஆன்லைன் புகார் அளிக்கவும் (cybercrime.gov.in)" : "For cyber fraud/online scam, file complaint at cybercrime.gov.in",
                            isTamil ? "புகார் நிலையை தொடர்ந்து கண்காணிக்கவும்" : "Track your complaint using the FIR number and follow up regularly"
                    },
                    new String[]{
                            "Indian Penal Code (IPC) Sections 406, 420 (Cheating/Fraud)",
                            "Information Technology Act, 2000 - Section 66D (Cyber Fraud)",
                            "Code of Criminal Procedure (CrPC) - Section 154, 156(3)",
                            "Tamil Nadu Protection of Interests of Depositors Act"
                    },
                    new String[]{
                            isTamil ? "மோசடி பற்றிய அனைத்து ஆதாரங்களும் (SMS, email, screenshots)" : "All evidence of the fraud (SMS, emails, screenshots, call recordings)",
                            isTamil ? "பண பரிவர்த்தனை ஆதாரங்கள் (bank statements, UPI records)" : "Bank statements / UPI transaction records / receipts",
                            isTamil ? "குற்றவாளியின் அடையாள தகவல்கள்" : "Identity information of the accused (name, phone, address if known)",
                            isTamil ? "சாட்சிகளின் பெயர் மற்றும் முகவரி" : "Names and contact details of witnesses"
                    },
                    isTamil ? "உள்ளூர் காவல் நிலையம், மாவட்ட காவல் கண்காணிப்பாளர் அலுவலகம் (SP Office), அல்லது cybercrime.gov.in" : "Local Police Station, District Superintendent of Police (SP) Office, or cybercrime.gov.in",
                    new String[]{
                            isTamil ? "சம்பவம் நடந்த உடனே புகார் அளிக்கவும் — தாமதம் விசாரணையை கடினமாக்கும்" : "File complaint immediately — delay weakens investigation and recovery of money",
                            isTamil ? "மேலும் பணம் அனுப்பவோ, தனிப்பட்ட தகவல்களை பகிரவோ வேண்டாம்" : "Do NOT send any more money or share personal/banking details with the scammer"
                    },
                    isTamil ? "FIR பதிவு: உடனடியாக | காவல் விசாரணை: 2–8 வாரங்கள் | நீதிமன்ற வழக்கு: 6 மாதங்கள்–3 ஆண்டுகள்" : "FIR registration: Immediately | Police investigation: 2-8 weeks | Court trial: 6 months–3 years"
            );
        } else if (lower.contains("consumer") || lower.contains("product") || lower.contains("refund") || lower.contains("நுகர்வோர்")) {
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "விற்பனையாளரிடம் எழுத்துப்பூர்வமாக புகார் அளிக்கவும்" : "Send a formal written complaint to the seller/service provider",
                            isTamil ? "மாவட்ட நுகர்வோர் குறைதீர் ஆணையத்தில் புகார் அளிக்கவும்" : "File a complaint at the District Consumer Disputes Redressal Commission",
                            isTamil ? "ஆன்லைன் நுகர்வோர் போர்ட்டலில் (consumerhelpline.gov.in) புகார் பதிவு செய்யலாம்" : "File online complaint at consumerhelpline.gov.in (National Consumer Helpline - 1800-11-4000)",
                            isTamil ? "தேவைப்பட்டால் வழக்கறிஞர் உதவியுடன் இழப்பீடு கோரலாம்" : "Claim compensation for mental agony, deficiency in service, and product cost"
                    },
                    new String[]{
                            "Consumer Protection Act, 2019 - Section 35",
                            "Sale of Goods Act, 1930",
                            "Bureau of Indian Standards Act, 2016",
                            "E-Commerce Rules, 2020 (Consumer Protection)"
                    },
                    new String[]{
                            isTamil ? "பில் / இன்வாய்ஸ் நகல்" : "Bill / Invoice copy",
                            isTamil ? "பொருள் / சேவையின் குறைபாட்டு ஆதாரங்கள்" : "Evidence of defect/deficiency (photos, videos)",
                            isTamil ? "நிறுவனத்திடம் அனுப்பிய புகார் கடிதங்கள்" : "Copy of complaint letters sent to the company",
                            isTamil ? "வாரண்டி / கேரண்டி கார்டு" : "Warranty / Guarantee card"
                    },
                    isTamil ? "மாவட்ட நுகர்வோர் குறைதீர் ஆணையம் (District Consumer Disputes Redressal Commission)" : "District Consumer Disputes Redressal Commission or National Consumer Helpline (1800-11-4000)",
                    new String[]{
                            isTamil ? "வாங்கிய தேதியிலிருந்து 2 ஆண்டுகளுக்குள் புகார் அளிக்கவும்" : "File complaint within 2 years from date of purchase (Limitation period)",
                            isTamil ? "ஆதாரங்கள் இல்லாமல் புகார் அளிக்க வேண்டாம்" : "Do not file complaint without supporting evidence — it may be dismissed"
                    },
                    isTamil ? "புகார் ஏற்றுக்கொள்ளுதல்: 2–4 வாரங்கள் | ஆணையம் தீர்ப்பு: 3–6 மாதங்கள்" : "Complaint acceptance: 2-4 weeks | Commission order: 3-6 months"
            );
        } else {
            // Generic fallback
            return buildCopilotJson(
                    isTamil,
                    new String[]{
                            isTamil ? "உங்கள் சட்ட பிரச்சினை தொடர்பான அனைத்து ஆவணங்களையும் சேகரிக்கவும்" : "Gather all documents and evidence related to your legal issue",
                            isTamil ? "அருகில் உள்ள சட்ட உதவி மையத்தை அணுகவும் (Legal Aid Centre)" : "Visit the nearest Legal Aid Centre (District Legal Services Authority - DLSA)",
                            isTamil ? "உரிய அதிகாரியிடம் எழுத்துப்பூர்வ புகார் அளிக்கவும்" : "File a formal written complaint with the appropriate authority",
                            isTamil ? "தேவைப்பட்டால் வழக்கறிஞர் ஆலோசனை பெறவும்" : "Consult an advocate for legal advice specific to your situation",
                            isTamil ? "RTI மூலம் தொடர்புடைய அரசு தகவல்களை பெறலாம்" : "Use RTI (Right to Information Act) to obtain relevant government records"
                    },
                    new String[]{
                            "Indian Constitution - Fundamental Rights (Articles 12-35)",
                            "Legal Services Authorities Act, 1987 (Free Legal Aid)",
                            "Right to Information Act, 2005",
                            "Code of Civil Procedure, 1908"
                    },
                    new String[]{
                            isTamil ? "அடையாள ஆவணங்கள் (Aadhaar, PAN)" : "Identity documents (Aadhaar card, PAN card)",
                            isTamil ? "பிரச்சினை தொடர்பான அனைத்து எழுத்துப்பூர்வ ஆதாரங்கள்" : "All written evidence and correspondence related to the issue",
                            isTamil ? "சாட்சிகளின் தகவல்கள்" : "Witness details (if any)",
                            isTamil ? "நிதி பரிவர்த்தனை பதிவுகள் (தேவைப்பட்டால்)" : "Financial transaction records (if applicable)"
                    },
                    isTamil ? "மாவட்ட சட்ட சேவை ஆணையம் (DLSA), மாவட்ட ஆட்சியர் அலுவலகம்" : "District Legal Services Authority (DLSA), District Collector Office, or relevant government department",
                    new String[]{
                            isTamil ? "காலவரையற்ற தாமதம் உங்கள் சட்ட உரிமையை பாதிக்கலாம்" : "Delayed action may affect your legal rights under the Limitation Act",
                            isTamil ? "தகுதியற்ற மத்தியஸ்தர்களை நம்பாதீர்கள்" : "Beware of unauthorized intermediaries who claim to resolve legal issues for money"
                    },
                    isTamil ? "ஆலோசனை மற்றும் ஆவண தயாரிப்பு: 1–2 வாரங்கள் | புகார் விசாரணை: 1–3 மாதங்கள் | நீதிமன்ற தீர்வு: 6 மாதங்கள்–3 ஆண்டுகள்" : "Consultation & documentation: 1-2 weeks | Complaint inquiry: 1-3 months | Court resolution: 6 months–3 years"
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