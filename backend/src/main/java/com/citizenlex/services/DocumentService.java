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

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the 10MB limit.");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            fileName = "unknown_document";
        }
        String fileType = file.getContentType();
        if (fileType == null) {
            fileType = "application/octet-stream";
        }

        logger.info("Uploading and analyzing file: {}, type: {} (size: {} bytes) for user: {}", fileName, fileType, file.getSize(), userId);

        String extractedText;
        try {
            extractedText = extractText(file);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to extract text from file: {}", fileName, e);
            throw new IllegalArgumentException("Failed to extract text from document: " + e.getMessage());
        }

        if (extractedText == null || extractedText.trim().isEmpty()) {
            throw new IllegalArgumentException("No text could be extracted from the document. Please ensure it is not empty, blank, or heavily corrupted.");
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

        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String contentType = file.getContentType();
        boolean isPdf = name.endsWith(".pdf") || "application/pdf".equals(contentType);
        boolean isDocx = name.endsWith(".docx") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType);
        boolean isTxt = name.endsWith(".txt") || "text/plain".equals(contentType);
        boolean isImage = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || (contentType != null && contentType.startsWith("image/"));

        if (!isPdf && !isDocx && !isTxt && !isImage) {
            throw new IllegalArgumentException("Unsupported file type. Please upload a PDF, DOCX, TXT file, or a JPEG/PNG image.");
        }

        if (isImage) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes)) {
                java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(bais);
                if (img == null) {
                    throw new IllegalArgumentException("The image file is corrupted, unreadable, or invalid.");
                }
                if (img.getWidth() < 120 || img.getHeight() < 120) {
                    throw new IllegalArgumentException("The image resolution is too low (less than 120x120px) to perform reliable text extraction.");
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("The image is corrupted or invalid: " + e.getMessage());
            }
        }

        if (isPdf) {
            String text = "";
            String nativeError = null;
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes)) {
                text = extractTextFromPdf(bais);
            } catch (IllegalArgumentException e) {
                throw e; // propagate encryption / password error
            } catch (Exception e) {
                logger.warn("Native PDF text extraction failed: {}", e.getMessage());
                nativeError = e.getMessage();
            }

            if (text == null || text.trim().length() < 100) {
                logger.info("PDF text empty or too short. Falling back to Gemini Multimodal OCR...");
                try {
                    String ocrText = geminiService.extractTextFromFileMultimodal(bytes, "application/pdf");
                    if (ocrText != null && !ocrText.trim().isEmpty()) {
                        return ocrText.trim();
                    }
                } catch (IllegalArgumentException e) {
                    if (text == null || text.trim().isEmpty()) {
                        throw e; // if completely blank and Gemini OCR fails, throw details
                    }
                }
            }

            if (nativeError != null && (text == null || text.trim().isEmpty())) {
                throw new IllegalArgumentException("The PDF file is invalid or corrupted: " + nativeError);
            }

            return text != null ? text.trim() : "";
        } else if (isDocx) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes)) {
                return extractTextFromDocx(bais).trim();
            } catch (Exception e) {
                logger.error("DOCX extraction failed", e);
                throw new IllegalArgumentException("The DOCX file is invalid or corrupted: " + e.getMessage());
            }
        } else if (isTxt) {
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8).trim();
        } else {
            // Must be isImage
            String cType = file.getContentType();
            if (cType == null) {
                if (name.endsWith(".png")) cType = "image/png";
                else cType = "image/jpeg";
            } else if ("image/jpg".equalsIgnoreCase(cType)) {
                cType = "image/jpeg";
            }
            return extractTextFromImage(bytes, cType);
        }
    }

    private String extractTextFromPdf(InputStream is) throws Exception {
        try (PDDocument document = PDDocument.load(is)) {
            if (document.isEncrypted()) {
                throw new IllegalArgumentException("The PDF file is password-protected or encrypted. Please remove password protection and try again.");
            }
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
                return ocrText.trim();
            }
        } catch (IllegalArgumentException e) {
            throw e; // propagate descriptive API exception directly
        } catch (Exception e) {
            logger.error("Image OCR extraction failed", e);
            throw new IllegalArgumentException("OCR failed on the image: " + e.getMessage());
        }

        throw new IllegalArgumentException("No text could be extracted from the image. Please make sure the image contains clear, readable text.");
    }
}
