package com.citizenlex.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    /**
     * Send email verification link to user.
     */
    public void sendEmailVerification(String toEmail, String firstName, String verificationLink) {
        String subject = "Verify your CitizenLex email address";
        String html = buildVerificationEmail(firstName, verificationLink);
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Send OTP via email (fallback if SMS is unavailable).
     */
    public void sendOtpEmail(String toEmail, String firstName, String otp) {
        String subject = "Your CitizenLex OTP Code";
        String html = buildOtpEmail(firstName, otp);
        sendHtmlEmail(toEmail, subject, html);
    }

    public boolean isConfigured() {
        return mailSender != null && senderEmail != null && !senderEmail.isBlank();
    }

    private void sendHtmlEmail(String to, String subject, String html) {
        if (!isConfigured()) {
            // Mock mode — log to console
            logger.info("=== [MOCK EMAIL] To: {} | Subject: {} ===", to, subject);
            logger.info("HTML content length: {} chars", html.length());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Email sent to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private String buildVerificationEmail(String name, String link) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#0f0e17;font-family:Inter,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px;">
                  <table width="600" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:40px;border:1px solid rgba(255,255,255,0.1);">
                    <tr><td align="center">
                      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;width:60px;height:60px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
                        <span style="font-size:28px;">⚖️</span>
                      </div>
                      <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">CitizenLex</h1>
                      <h2 style="color:#a0aec0;font-size:16px;font-weight:400;margin:0 0 32px;">Your Rights. Your Voice.</h2>
                      <h3 style="color:#fff;font-size:20px;margin:0 0 16px;">Verify your email address</h3>
                      <p style="color:#a0aec0;font-size:15px;margin:0 0 32px;line-height:1.6;">
                        Hi %s,<br><br>
                        Welcome to CitizenLex! Please verify your email address by clicking the button below.
                        This link expires in <strong style="color:#6366f1;">24 hours</strong>.
                      </p>
                      <a href="%s" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:600;font-size:15px;display:inline-block;">
                        Verify Email Address
                      </a>
                      <p style="color:#718096;font-size:12px;margin:32px 0 0;">
                        If you didn't create a CitizenLex account, you can safely ignore this email.
                      </p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(name, link);
    }

    private String buildOtpEmail(String name, String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#0f0e17;font-family:Inter,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:40px 20px;">
                  <table width="600" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:40px;border:1px solid rgba(255,255,255,0.1);">
                    <tr><td align="center">
                      <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">CitizenLex</h1>
                      <h3 style="color:#fff;font-size:20px;margin:0 0 16px;">Your OTP Code</h3>
                      <p style="color:#a0aec0;font-size:15px;margin:0 0 24px;">Hi %s, use this code to verify your mobile number:</p>
                      <div style="background:rgba(99,102,241,0.15);border:2px solid #6366f1;border-radius:16px;padding:24px 40px;display:inline-block;margin-bottom:24px;">
                        <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#6366f1;">%s</span>
                      </div>
                      <p style="color:#718096;font-size:13px;margin:0;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(name, otp);
    }

    public void sendAppointmentNotification(String toEmail, String subject, String htmlContent) {
        sendHtmlEmail(toEmail, subject, htmlContent);
    }
}
