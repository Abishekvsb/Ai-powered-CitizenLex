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
}