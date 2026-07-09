package com.citizenlex.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"
    );

    private final Cloudinary cloudinary;
    private final boolean isMockMode;
    private final boolean isProduction;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.isMockMode = "mock".equalsIgnoreCase(cloudName) || "mock".equalsIgnoreCase(apiKey) || "mock".equalsIgnoreCase(apiSecret) ||
                          cloudName == null || cloudName.isBlank() ||
                          apiKey == null || apiKey.isBlank() ||
                          apiSecret == null || apiSecret.isBlank();
        
        this.isProduction = "production".equalsIgnoreCase(System.getenv("RAILWAY_ENVIRONMENT")) ||
                            "production".equalsIgnoreCase(System.getenv("SPRING_PROFILES_ACTIVE"));

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", isMockMode ? "mock" : cloudName,
                "api_key", isMockMode ? "mock" : apiKey,
                "api_secret", isMockMode ? "mock" : apiSecret,
                "secure", true
        ));
        logger.info("CloudinaryService initialized. Mock mode: {}, Production mode: {}", isMockMode, isProduction);
    }

    public Map<String, String> uploadDocument(MultipartFile file, Long userId, String docType) throws IOException {
        if (isMockMode) {
            if (isProduction) {
                throw new IllegalStateException("Cloudinary document upload service is not configured in production. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway variables.");
            }
            return uploadLocalFallback(file, userId, docType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5 MB limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.");
        }

        String publicId = "citizenlex/documents/user_" + userId + "_" + docType + "_" + UUID.randomUUID().toString().substring(0, 8);
        logger.info("Uploading document for user {} of type {} with publicId {}", userId, docType, publicId);

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "auto",
                "folder", "citizenlex/documents"
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        String resultPublicId = (String) uploadResult.get("public_id");

        logger.info("Successfully uploaded document for user {}. URL: {}", userId, secureUrl);
        return Map.of("url", secureUrl, "publicId", resultPublicId);
    }

    /**
     * Upload a profile image to Cloudinary.
     * @param file the multipart image file
     * @param userId the user's ID (used to generate a unique public ID)
     * @return a Map with "url" (secure URL) and "publicId" keys
     */
    public Map<String, String> uploadProfileImage(MultipartFile file, Long userId) throws IOException {
        if (isMockMode) {
            if (isProduction) {
                throw new IllegalStateException("Cloudinary photo upload service is not configured in production. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Railway variables.");
            }
            return uploadLocalFallback(file, userId, "profile_photo");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5 MB limit. Please upload a smaller image.");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPG, PNG, and WEBP are allowed.");
        }

        String publicId = "citizenlex/profiles/user_" + userId + "_" + UUID.randomUUID().toString().substring(0, 8);

        logger.info("Uploading profile image for user {} with publicId {}", userId, publicId);

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "image",
                "folder", "citizenlex/profiles",
                "transformation", new com.cloudinary.Transformation()
                        .width(400)
                        .height(400)
                        .crop("fill")
                        .gravity("face")
                        .quality("auto")
                        .fetchFormat("auto")
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        String resultPublicId = (String) uploadResult.get("public_id");

        logger.info("Successfully uploaded profile image for user {}. URL: {}", userId, secureUrl);
        return Map.of("url", secureUrl, "publicId", resultPublicId);
    }

    /**
     * Delete a profile image from Cloudinary by its public ID.
     * @param publicId the Cloudinary public ID of the image
     */
    public void deleteProfileImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            logger.warn("Attempted to delete image with null/blank publicId — skipping.");
            return;
        }

        if (publicId.startsWith("local_")) {
            String fileName = publicId.substring(6);
            File file = new File(System.getProperty("user.dir") + "/uploads/" + fileName);
            if (file.exists()) {
                file.delete();
                logger.info("Successfully deleted local fallback file: {}", fileName);
            } else {
                logger.warn("Local fallback file not found for deletion: {}", fileName);
            }
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            logger.info("Successfully deleted Cloudinary image with publicId: {}", publicId);
        } catch (Exception e) {
            logger.error("Failed to delete Cloudinary image with publicId: {}", publicId, e);
        }
    }

    /**
     * Local storage upload fallback for non-production environments.
     */
    private Map<String, String> uploadLocalFallback(MultipartFile file, Long userId, String type) throws IOException {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5 MB limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type.");
        }

        File uploadDir = new File(System.getProperty("user.dir") + "/uploads");
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        String ext = "jpg";
        if (contentType.contains("png")) ext = "png";
        else if (contentType.contains("webp")) ext = "webp";
        else if (contentType.contains("pdf")) ext = "pdf";

        String fileName = "user_" + userId + "_" + type + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
        File destFile = new File(uploadDir, fileName);
        Files.write(destFile.toPath(), file.getBytes());

        logger.info("Local fallback upload success for user {}: {}", userId, fileName);
        return Map.of("url", "/api/uploads/" + fileName, "publicId", "local_" + fileName);
    }
}
