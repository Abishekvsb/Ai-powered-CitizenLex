package com.citizenlex.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    @Size(max = 100, message = "Email must be under 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be under 50 characters")
    private String firstName;

    // lastName is OPTIONAL — a single-name user is valid
    @Size(max = 50, message = "Last name must be under 50 characters")
    private String lastName;

    // Optional mobile number field
    private String mobile;

    private Boolean smsNotificationsEnabled;

    public RegisterRequest() {}

    public RegisterRequest(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName == null ? "" : lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public Boolean getSmsNotificationsEnabled() { return smsNotificationsEnabled; }
    public void setSmsNotificationsEnabled(Boolean smsNotificationsEnabled) {
        this.smsNotificationsEnabled = smsNotificationsEnabled;
    }
}
