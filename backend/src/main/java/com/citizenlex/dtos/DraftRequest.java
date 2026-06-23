package com.citizenlex.dtos;

import jakarta.validation.constraints.NotBlank;

public class DraftRequest {

    @NotBlank
    private String type;

    private String language = "en";

    @NotBlank
    private String details;

    public DraftRequest() {}

    public DraftRequest(String type, String language, String details) {
        this.type = type;
        this.language = language;
        this.details = details;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
