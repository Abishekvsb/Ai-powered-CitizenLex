package com.citizenlex.dtos;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private LocalDateTime createdAt;

    // Extended profile fields
    private String profileImageUrl;
    private String mobile;
    private LocalDate dateOfBirth;
    private String gender;
    private String state;
    private String district;
    private String address;
    private String preferredLanguage;
    private String occupation;

    // Verification status
    private Boolean emailVerified;
    private Boolean mobileVerified;

    // Login audit
    private String lastLogin;
    private String lastLoginDevice;

    // Notification preferences
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean reminderNotifications;
    private Boolean marketingEmails;
    private Boolean productUpdates;

    public UserDto() {}

    // Original constructor (backward compat)
    public UserDto(Long id, String email, String firstName, String lastName, String role, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.createdAt = createdAt;
    }

    // Full constructor including all profile fields
    public UserDto(Long id, String email, String firstName, String lastName, String role, LocalDateTime createdAt,
                   String profileImageUrl, String mobile, LocalDate dateOfBirth, String gender,
                   String state, String district, String address, String preferredLanguage, String occupation) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.createdAt = createdAt;
        this.profileImageUrl = profileImageUrl;
        this.mobile = mobile;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.state = state;
        this.district = district;
        this.address = address;
        this.preferredLanguage = preferredLanguage;
        this.occupation = occupation;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

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

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getMobileVerified() { return mobileVerified; }
    public void setMobileVerified(Boolean mobileVerified) { this.mobileVerified = mobileVerified; }

    public String getLastLogin() { return lastLogin; }
    public void setLastLogin(String lastLogin) { this.lastLogin = lastLogin; }

    public String getLastLoginDevice() { return lastLoginDevice; }
    public void setLastLoginDevice(String lastLoginDevice) { this.lastLoginDevice = lastLoginDevice; }

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
}
