package com.citizenlex.services;

import com.citizenlex.entities.User;
import com.citizenlex.entities.UserDocument;
import com.citizenlex.repositories.UserDocumentRepository;
import com.citizenlex.repositories.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private UserDocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private LogService logService;

    @Transactional
    public UserDocument uploadAndAnalyze(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            fileName = "unknown_document";
        }
        String fileType = file.getContentType();
        if (fileType == null) {
            fileType = "application/octet-stream";
        }

        logger.info("Uploading and analyzing file: {}, type: {} for user: {}", fileName, fileType, userId);

        String extractedText = "";
        try {
            extractedText = extractText(file);
        } catch (Exception e) {
            logger.error("Failed to extract text from file: {}", fileName, e);
            extractedText = "Error during text extraction: " + e.getMessage();
        }

        // Generate summary using GeminiService
        String summary = geminiService.getDocumentSummary(fileName, extractedText);

        // Save record to DB
        UserDocument doc = new UserDocument(user, fileName, fileType, extractedText, summary);
        UserDocument savedDoc = documentRepository.save(doc);

        // Log action
        logService.logActivity(user, "UPLOAD_DOCUMENT", "Uploaded and analyzed document: " + fileName + " (Type: " + fileType + ")");

        return savedDoc;
    }

    public List<UserDocument> getUserDocuments(Long userId) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public UserDocument getDocumentById(Long documentId, Long userId) {
        UserDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + documentId));

        // Security check
        if (!doc.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to this document.");
        }

        return doc;
    }

    @Transactional
    public void deleteDocument(Long documentId, Long userId) {
        UserDocument doc = getDocumentById(documentId, userId);
        documentRepository.delete(doc);
        logService.logActivity(doc.getUser(), "DELETE_DOCUMENT", "Deleted document: " + doc.getFileName());
    }

    private String extractText(MultipartFile file) throws Exception {
        String name = file.getOriginalFilename();
        if (name == null) name = "";
        name = name.toLowerCase();
        byte[] bytes = file.getBytes();

        if (name.endsWith(".pdf") || "application/pdf".equals(file.getContentType())) {
            String text = "";
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes)) {
                text = extractTextFromPdf(bais);
            } catch (Exception e) {
                logger.warn("Native PDF text extraction failed: {}", e.getMessage());
            }

            if (text == null || text.trim().length() < 100) {
                logger.info("PDF text empty or too short. Falling back to Gemini Multimodal OCR...");
                String ocrText = geminiService.extractTextFromFileMultimodal(bytes, "application/pdf");
                if (ocrText != null && !ocrText.trim().isEmpty()) {
                    return ocrText;
                }
            }
            return text != null ? text.trim() : "";
        } else if (name.endsWith(".docx") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(file.getContentType())) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes)) {
                return extractTextFromDocx(bais).trim();
            }
        } else if (name.endsWith(".txt") || "text/plain".equals(file.getContentType())) {
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8).trim();
        } else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || (file.getContentType() != null && file.getContentType().startsWith("image/"))) {
            return extractTextFromImage(bytes, file.getContentType());
        } else {
            // General text fallback (try to read bytes if it's text)
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8).trim();
        }
    }

    private String extractTextFromPdf(InputStream is) throws Exception {
        try (PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromDocx(InputStream is) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String extractTextFromImage(byte[] bytes, String contentType) {
        try {
            String ocrText = geminiService.extractTextFromFileMultimodal(bytes, contentType);
            if (ocrText != null && !ocrText.trim().isEmpty()) {
                return ocrText;
            }
        } catch (Exception e) {
            logger.error("Image OCR extraction failed, falling back to static metadata description", e);
        }

        return "SCANNED IMAGE DOCUMENT\n" +
                "Date: " + java.time.LocalDate.now().toString() + "\n" +
                "Analysis Status: Text extraction was run using fallback due to API offline status.\n" +
                "Please verify the contents manually.";
    }
}
