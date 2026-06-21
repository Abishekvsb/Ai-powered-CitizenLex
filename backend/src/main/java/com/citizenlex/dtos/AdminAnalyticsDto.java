package com.citizenlex.dtos;

public class AdminAnalyticsDto {
    private long totalUsers;
    private long totalRights;
    private long totalSchemes;
    private long totalDocuments;
    private long totalChats;

    public AdminAnalyticsDto() {}

    public AdminAnalyticsDto(long totalUsers, long totalRights, long totalSchemes, long totalDocuments, long totalChats) {
        this.totalUsers = totalUsers;
        this.totalRights = totalRights;
        this.totalSchemes = totalSchemes;
        this.totalDocuments = totalDocuments;
        this.totalChats = totalChats;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalRights() {
        return totalRights;
    }

    public void setTotalRights(long totalRights) {
        this.totalRights = totalRights;
    }

    public long getTotalSchemes() {
        return totalSchemes;
    }

    public void setTotalSchemes(long totalSchemes) {
        this.totalSchemes = totalSchemes;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(long totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public long getTotalChats() {
        return totalChats;
    }

    public void setTotalChats(long totalChats) {
        this.totalChats = totalChats;
    }
}
