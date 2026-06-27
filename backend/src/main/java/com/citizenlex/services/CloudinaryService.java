package com.citizenlex.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        logger.info("CloudinaryService initialized for cloud: {}", cloudName);
    }

    /**
     * Upload a profile image to Cloudinary.
     * @param file the multipart image file
     * @param userId the user's ID (used to generate a unique public ID)
     * @return a Map with "url" (secure URL) and "publicId" keys
     */
    public Map<String, String> uploadProfileImage(MultipartFile file, Long userId) throws IOException {
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
                "transformation", ObjectUtils.asMap(
                        "width", 400,
                        "height", 400,
                        "crop", "fill",
                        "gravity", "face",
                        "quality", "auto",
                        "fetch_format", "auto"
                )
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
            logger.warn("Attempted to delete Cloudinary image with null/blank publicId — skipping.");
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            logger.info("Successfully deleted Cloudinary image with publicId: {}", publicId);
        } catch (Exception e) {
            logger.error("Failed to delete Cloudinary image with publicId: {}", publicId, e);
            // Don't throw — image deletion failure shouldn't block profile operations
        }
    }
}
