package com.citizenlex.dtos;

public class AdminAnalyticsDto {
    private long totalUsers;
    private long totalRights;
    private long totalSchemes;
    private long totalDocuments;
    private long totalChats;
    private long totalDrafts;

    // New Phase 6.5 metrics
    private long activeUsers;
    private long dailyLogins;
    private long aiRequests;
    private long ocrUsage;
    private long voiceAiUsage;
    private double storageUsedGb;
    private long cloudinaryUsage;
    private long emailNotificationsEnabled;
    private long pushNotificationsEnabled;
    private long reminderNotificationsEnabled;
    private double monthlyRecurringRevenue;
    private long premiumUsers;

    public AdminAnalyticsDto() {}

    // Legacy constructor
    public AdminAnalyticsDto(long totalUsers, long totalRights, long totalSchemes, long totalDocuments, long totalChats, long totalDrafts) {
        this.totalUsers = totalUsers;
        this.totalRights = totalRights;
        this.totalSchemes = totalSchemes;
        this.totalDocuments = totalDocuments;
        this.totalChats = totalChats;
        this.totalDrafts = totalDrafts;
    }

    // Full constructor
    public AdminAnalyticsDto(long totalUsers, long totalRights, long totalSchemes, long totalDocuments, long totalChats, long totalDrafts,
                             long activeUsers, long dailyLogins, long aiRequests, long ocrUsage, long voiceAiUsage,
                             double storageUsedGb, long cloudinaryUsage, long emailNotificationsEnabled,
                             long pushNotificationsEnabled, long reminderNotificationsEnabled,
                             double monthlyRecurringRevenue, long premiumUsers) {
        this.totalUsers = totalUsers;
        this.totalRights = totalRights;
        this.totalSchemes = totalSchemes;
        this.totalDocuments = totalDocuments;
        this.totalChats = totalChats;
        this.totalDrafts = totalDrafts;
        this.activeUsers = activeUsers;
        this.dailyLogins = dailyLogins;
        this.aiRequests = aiRequests;
        this.ocrUsage = ocrUsage;
        this.voiceAiUsage = voiceAiUsage;
        this.storageUsedGb = storageUsedGb;
        this.cloudinaryUsage = cloudinaryUsage;
        this.emailNotificationsEnabled = emailNotificationsEnabled;
        this.pushNotificationsEnabled = pushNotificationsEnabled;
        this.reminderNotificationsEnabled = reminderNotificationsEnabled;
        this.monthlyRecurringRevenue = monthlyRecurringRevenue;
        this.premiumUsers = premiumUsers;
    }

    // Getters & Setters
    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalRights() { return totalRights; }
    public void setTotalRights(long totalRights) { this.totalRights = totalRights; }

    public long getTotalSchemes() { return totalSchemes; }
    public void setTotalSchemes(long totalSchemes) { this.totalSchemes = totalSchemes; }

    public long getTotalDocuments() { return totalDocuments; }
    public void setTotalDocuments(long totalDocuments) { this.totalDocuments = totalDocuments; }

    public long getTotalChats() { return totalChats; }
    public void setTotalChats(long totalChats) { this.totalChats = totalChats; }

    public long getTotalDrafts() { return totalDrafts; }
    public void setTotalDrafts(long totalDrafts) { this.totalDrafts = totalDrafts; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getDailyLogins() { return dailyLogins; }
    public void setDailyLogins(long dailyLogins) { this.dailyLogins = dailyLogins; }

    public long getAiRequests() { return aiRequests; }
    public void setAiRequests(long aiRequests) { this.aiRequests = aiRequests; }

    public long getOcrUsage() { return ocrUsage; }
    public void setOcrUsage(long ocrUsage) { this.ocrUsage = ocrUsage; }

    public long getVoiceAiUsage() { return voiceAiUsage; }
    public void setVoiceAiUsage(long voiceAiUsage) { this.voiceAiUsage = voiceAiUsage; }

    public double getStorageUsedGb() { return storageUsedGb; }
    public void setStorageUsedGb(double storageUsedGb) { this.storageUsedGb = storageUsedGb; }

    public long getCloudinaryUsage() { return cloudinaryUsage; }
    public void setCloudinaryUsage(long cloudinaryUsage) { this.cloudinaryUsage = cloudinaryUsage; }

    public long getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(long emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }

    public long getPushNotificationsEnabled() { return pushNotificationsEnabled; }
    public void setPushNotificationsEnabled(long pushNotificationsEnabled) { this.pushNotificationsEnabled = pushNotificationsEnabled; }

    public long getReminderNotificationsEnabled() { return reminderNotificationsEnabled; }
    public void setReminderNotificationsEnabled(long reminderNotificationsEnabled) { this.reminderNotificationsEnabled = reminderNotificationsEnabled; }

    public double getMonthlyRecurringRevenue() { return monthlyRecurringRevenue; }
    public void setMonthlyRecurringRevenue(double monthlyRecurringRevenue) { this.monthlyRecurringRevenue = monthlyRecurringRevenue; }

    public long getPremiumUsers() { return premiumUsers; }
    public void setPremiumUsers(long premiumUsers) { this.premiumUsers = premiumUsers; }
}
