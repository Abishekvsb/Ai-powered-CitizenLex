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

        try (InputStream is = file.getInputStream()) {
            if (name.endsWith(".pdf") || "application/pdf".equals(file.getContentType())) {
                return extractTextFromPdf(is);
            } else if (name.endsWith(".docx") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(file.getContentType())) {
                return extractTextFromDocx(is);
            } else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || (file.getContentType() != null && file.getContentType().startsWith("image/"))) {
                return extractTextFromImage(file);
            } else {
                // General text fallback (try to read bytes if it's text)
                byte[] bytes = file.getBytes();
                return new String(bytes, "UTF-8");
            }
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

    private String extractTextFromImage(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String ocrText = geminiService.extractTextFromImageMultimodal(bytes, file.getContentType());
            if (ocrText != null && !ocrText.trim().isEmpty()) {
                return ocrText;
            }
        } catch (Exception e) {
            logger.error("Image OCR extraction failed, falling back to static metadata description", e);
        }

        return "SCANNED IMAGE DOCUMENT: " + file.getOriginalFilename() + "\n" +
                "Date: " + java.time.LocalDate.now().toString() + "\n" +
                "Analysis Status: Text extraction was run using fallback due to API offline status.\n" +
                "Please verify the contents manually.";
    }
}
