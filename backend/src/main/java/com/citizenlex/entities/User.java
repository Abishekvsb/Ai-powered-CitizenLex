package com.citizenlex.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, name = "first_name", length = 50)
    private String firstName;

    @Column(nullable = false, name = "last_name", length = 50)
    private String lastName;

    // Profile image URL stored in Cloudinary
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // Cloudinary public ID for deletion
    @Column(name = "cloudinary_public_id", length = 200)
    private String cloudinaryPublicId;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "preferred_language", length = 50)
    private String preferredLanguage;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;

    // --- Email Verification ---
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "email_verification_token", length = 200)
    private String emailVerificationToken;

    @Column(name = "email_verification_token_expiry")
    private LocalDateTime emailVerificationTokenExpiry;

    // --- Mobile OTP Verification ---
    @Column(name = "mobile_verified", nullable = false)
    private Boolean mobileVerified = false;

    @Column(name = "mobile_otp", length = 10)
    private String mobileOtp;

    @Column(name = "mobile_otp_expiry")
    private LocalDateTime mobileOtpExpiry;

    // --- Login Audit ---
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_login_device", length = 200)
    private String lastLoginDevice;

    @Column(name = "last_login_ip", length = 50)
    private String lastLoginIp;

    // --- Notification Preferences ---
    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications = true;

    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications = true;

    @Column(name = "reminder_notifications", nullable = false)
    private Boolean reminderNotifications = true;

    @Column(name = "marketing_emails", nullable = false)
    private Boolean marketingEmails = false;

    @Column(name = "product_updates", nullable = false)
    private Boolean productUpdates = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public User() {
        this.createdAt = LocalDateTime.now();
        this.emailVerified = false;
        this.mobileVerified = false;
        this.emailNotifications = true;
        this.pushNotifications = true;
        this.reminderNotifications = true;
        this.marketingEmails = false;
        this.productUpdates = true;
    }

    public User(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.enabled = true;
        this.createdAt = LocalDateTime.now();
        this.emailVerified = false;
        this.mobileVerified = false;
        this.emailNotifications = true;
        this.pushNotifications = true;
        this.reminderNotifications = true;
        this.marketingEmails = false;
        this.productUpdates = true;
    }

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getCloudinaryPublicId() { return cloudinaryPublicId; }
    public void setCloudinaryPublicId(String cloudinaryPublicId) { this.cloudinaryPublicId = cloudinaryPublicId; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getEmailVerificationToken() { return emailVerificationToken; }
    public void setEmailVerificationToken(String emailVerificationToken) { this.emailVerificationToken = emailVerificationToken; }

    public LocalDateTime getEmailVerificationTokenExpiry() { return emailVerificationTokenExpiry; }
    public void setEmailVerificationTokenExpiry(LocalDateTime emailVerificationTokenExpiry) { this.emailVerificationTokenExpiry = emailVerificationTokenExpiry; }

    public Boolean getMobileVerified() { return mobileVerified; }
    public void setMobileVerified(Boolean mobileVerified) { this.mobileVerified = mobileVerified; }

    public String getMobileOtp() { return mobileOtp; }
    public void setMobileOtp(String mobileOtp) { this.mobileOtp = mobileOtp; }

    public LocalDateTime getMobileOtpExpiry() { return mobileOtpExpiry; }
    public void setMobileOtpExpiry(LocalDateTime mobileOtpExpiry) { this.mobileOtpExpiry = mobileOtpExpiry; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public String getLastLoginDevice() { return lastLoginDevice; }
    public void setLastLoginDevice(String lastLoginDevice) { this.lastLoginDevice = lastLoginDevice; }

    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }

    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public Boolean getPushNotifications() { return pushNotifications; }
    public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }

    public Boolean getReminderNotifications() { return reminderNotifications; }
    public void setReminderNotifications(Boolean reminderNotifications) { this.reminderNotifications = reminderNotifications; }

    public Boolean getMarketingEmails() { return marketingEmails; }
    public void setMarketingEmails(Boolean marketingEmails) { this.marketingEmails = marketingEmails; }

    public Boolean getProductUpdates() { return productUpdates; }
    public void setProductUpdates(Boolean productUpdates) { this.productUpdates = productUpdates; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
}
