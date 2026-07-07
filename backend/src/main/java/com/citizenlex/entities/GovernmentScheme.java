package com.citizenlex.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "government_schemes")
public class GovernmentScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String eligibility;

    @Column(name = "required_documents", nullable = false, columnDefinition = "TEXT")
    private String requiredDocuments;

    @Column(name = "application_process", nullable = false, columnDefinition = "TEXT")
    private String applicationProcess;

    @Column(name = "official_link", length = 500)
    private String officialLink;

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefits;

    @Column(name = "department_name", length = 300)
    private String departmentName;

    @Column(name = "helpline_number", length = 100)
    private String helplineNumber;

    @Column(name = "office_address", columnDefinition = "TEXT")
    private String officeAddress;

    @Column(name = "offline_instructions", columnDefinition = "TEXT")
    private String offlineInstructions;

    @Column(name = "last_updated", length = 50)
    private String lastUpdated;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public GovernmentScheme() {
        this.createdAt = LocalDateTime.now();
    }

    public GovernmentScheme(String title, String category, String eligibility, String requiredDocuments, String applicationProcess, String officialLink) {
        this.title = title;
        this.category = category;
        this.eligibility = eligibility;
        this.requiredDocuments = requiredDocuments;
        this.applicationProcess = applicationProcess;
        this.officialLink = officialLink;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getEligibility() { return eligibility; }
    public void setEligibility(String eligibility) { this.eligibility = eligibility; }
    public String getRequiredDocuments() { return requiredDocuments; }
    public void setRequiredDocuments(String requiredDocuments) { this.requiredDocuments = requiredDocuments; }
    public String getApplicationProcess() { return applicationProcess; }
    public void setApplicationProcess(String applicationProcess) { this.applicationProcess = applicationProcess; }
    public String getOfficialLink() { return officialLink; }
    public void setOfficialLink(String officialLink) { this.officialLink = officialLink; }
    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getHelplineNumber() { return helplineNumber; }
    public void setHelplineNumber(String helplineNumber) { this.helplineNumber = helplineNumber; }
    public String getOfficeAddress() { return officeAddress; }
    public void setOfficeAddress(String officeAddress) { this.officeAddress = officeAddress; }
    public String getOfflineInstructions() { return offlineInstructions; }
    public void setOfflineInstructions(String offlineInstructions) { this.offlineInstructions = offlineInstructions; }
    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
