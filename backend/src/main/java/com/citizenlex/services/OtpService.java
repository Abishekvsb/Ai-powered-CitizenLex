package com.citizenlex.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.security.SecureRandom;
import java.util.Map;

/**
 * OTP Service supporting Twilio, MSG91, Fast2SMS, and mock console mode.
 * Provider is configured via SMS_PROVIDER env var (default: mock).
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom random = new SecureRandom();

    @Value("${app.sms.provider:mock}")
    private String provider;

    @Value("${app.sms.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.sms.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.sms.twilio.from-number:}")
    private String twilioFromNumber;

    @Value("${app.sms.fast2sms.api-key:}")
    private String fast2SmsApiKey;

    @Value("${app.sms.msg91.auth-key:}")
    private String msg91AuthKey;

    @Value("${app.sms.msg91.template-id:}")
    private String msg91TemplateId;

    /**
     * Generate a 6-digit OTP.
     */
    public String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    public boolean isMock() {
        return "mock".equalsIgnoreCase(provider) || provider == null || provider.isBlank();
    }

    /**
     * Send OTP to the specified phone number using the configured provider.
     */
    public void sendOtp(String phoneNumber, String otp) {
        logger.info("Sending OTP via provider: {}", provider);

        switch (provider.toLowerCase()) {
            case "twilio" -> sendViaTwilio(phoneNumber, otp);
            case "fast2sms" -> sendViaFast2Sms(phoneNumber, otp);
            case "msg91" -> sendViaMSG91(phoneNumber, otp);
            default -> {
                if (!isMock()) {
                    throw new IllegalArgumentException("Unknown SMS provider: " + provider);
                }
                logMockOtp(phoneNumber, otp);
            }
        }
    }

    private void sendViaTwilio(String phoneNumber, String otp) {
        if (twilioAccountSid.isBlank() || twilioAuthToken.isBlank()) {
            throw new IllegalStateException("Twilio credentials are not configured on the server.");
        }
        try {
            RestTemplate rest = new RestTemplate();
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";
            String body = "From=" + twilioFromNumber + "&To=" + phoneNumber + "&Body=Your+CitizenLex+OTP+is:+" + otp + ".+Expires+in+10+minutes.";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(twilioAccountSid, twilioAuthToken);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            rest.postForEntity(url, request, String.class);
            logger.info("Twilio OTP sent to: {}", phoneNumber);
        } catch (Exception e) {
            logger.error("Twilio OTP failed for {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Twilio SMS send failed: " + e.getMessage(), e);
        }
    }

    private void sendViaFast2Sms(String phoneNumber, String otp) {
        if (fast2SmsApiKey.isBlank()) {
            throw new IllegalStateException("Fast2SMS API key not configured on the server.");
        }
        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", fast2SmsApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String payload = "{\"variables_values\":\"" + otp + "\",\"route\":\"dlt\",\"numbers\":\"" + phoneNumber + "\"}";
            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            rest.postForEntity("https://www.fast2sms.com/dev/bulkV2", request, String.class);
            logger.info("Fast2SMS OTP sent to: {}", phoneNumber);
        } catch (Exception e) {
            logger.error("Fast2SMS OTP failed for {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Fast2SMS SMS send failed: " + e.getMessage(), e);
        }
    }

    private void sendViaMSG91(String phoneNumber, String otp) {
        if (msg91AuthKey.isBlank()) {
            throw new IllegalStateException("MSG91 credentials not configured on the server.");
        }
        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", msg91AuthKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String payload = "{\"template_id\":\"" + msg91TemplateId + "\",\"mobile\":\""
                    + phoneNumber + "\",\"authkey\":\"" + msg91AuthKey + "\",\"otp\":\"" + otp + "\"}";
            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            rest.postForEntity("https://control.msg91.com/api/v5/otp", request, String.class);
            logger.info("MSG91 OTP sent to: {}", phoneNumber);
        } catch (Exception e) {
            logger.error("MSG91 OTP failed for {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("MSG91 SMS send failed: " + e.getMessage(), e);
        }
    }

    private void logMockOtp(String phoneNumber, String otp) {
        logger.info("========================================");
        logger.info("  MOCK SMS OTP — NOT SENT VIA PROVIDER");
        logger.info("  Phone: {}", phoneNumber);
        logger.info("  OTP:   {}", otp);
        logger.info("========================================");
    }
}
