package com.citizenlex.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class UserDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    public UserDocument() {
        this.uploadedAt = LocalDateTime.now();
    }

    public UserDocument(User user, String fileName, String fileType, String extractedText, String summary) {
        this.user = user;
        this.fileName = fileName;
        this.fileType = fileType;
        this.extractedText = extractedText;
        this.summary = summary;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
