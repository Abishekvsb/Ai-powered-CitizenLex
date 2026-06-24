package com.citizenlex.dtos;

import jakarta.validation.constraints.NotBlank;

public class CopilotRequest {

    @NotBlank
    private String problem;

    private String language = "en";

    public CopilotRequest() {}

    public CopilotRequest(String problem, String language) {
        this.problem = problem;
        this.language = language;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
