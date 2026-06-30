package com.citizenlex.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "lawyers")
public class Lawyer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "advocate_id", nullable = false, unique = true, length = 100)
    private String advocateId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "specialization_id", nullable = false)
    private Specialization specialization;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "consultation_fee", nullable = false)
    private Double consultationFee;

    @Column(name = "court_name", length = 200)
    private String courtName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 200)
    private String languages;

    @Column(name = "working_hours", length = 100)
    private String workingHours;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "verification_status", length = 20)
    private String verificationStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "rating")
    private Double rating = 5.0;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(length = 300)
    private String qualifications;

    @Column(length = 300)
    private String achievements;

    // Document uploads
    @Column(name = "bar_council_id_url", length = 500)
    private String barCouncilIdUrl;

    @Column(name = "license_certificate_url", length = 500)
    private String licenseCertificateUrl;

    @Column(name = "gov_id_url", length = 500)
    private String govIdUrl;

    public Lawyer() {
        this.isVerified = false;
        this.verificationStatus = "PENDING";
        this.isOnline = false;
        this.rating = 5.0;
        this.totalReviews = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getAdvocateId() { return advocateId; }
    public void setAdvocateId(String advocateId) { this.advocateId = advocateId; }

    public Specialization getSpecialization() { return specialization; }
    public void setSpecialization(Specialization specialization) { this.specialization = specialization; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

    public String getCourtName() { return courtName; }
    public void setCourtName(String courtName) { this.courtName = courtName; }

    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public Boolean getIsVerified() { return isVerified != null && isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public Boolean getIsOnline() { return isOnline != null && isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public String getAchievements() { return achievements; }
    public void setAchievements(String achievements) { this.achievements = achievements; }

    public String getBarCouncilIdUrl() { return barCouncilIdUrl; }
    public void setBarCouncilIdUrl(String barCouncilIdUrl) { this.barCouncilIdUrl = barCouncilIdUrl; }

    public String getLicenseCertificateUrl() { return licenseCertificateUrl; }
    public void setLicenseCertificateUrl(String licenseCertificateUrl) { this.licenseCertificateUrl = licenseCertificateUrl; }

    public String getGovIdUrl() { return govIdUrl; }
    public void setGovIdUrl(String govIdUrl) { this.govIdUrl = govIdUrl; }
}
