package com.citizenlex.services;

import com.citizenlex.entities.*;
import com.citizenlex.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private LawyerRepository lawyerRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private VideoMeetingRepository videoMeetingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    public List<Appointment> getAppointmentsForUser(User user) {
        return appointmentRepository.findByUser(user);
    }

    public List<Appointment> getAppointmentsForLawyer(Lawyer lawyer) {
        return appointmentRepository.findByLawyer(lawyer);
    }

    @Transactional
    public Appointment bookAppointment(User client, Long lawyerId, LocalDate date, String timeSlot, String notes) {
        Lawyer lawyer = lawyerRepository.findById(lawyerId)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));

        // Check if slot is already booked for this lawyer on this date
        List<Appointment> existing = appointmentRepository.findByLawyerAndAppointmentDate(lawyer, date);
        for (Appointment appt : existing) {
            if (appt.getTimeSlot().equalsIgnoreCase(timeSlot) && 
                (appt.getStatus().equals("PENDING") || appt.getStatus().equals("APPROVED"))) {
                throw new RuntimeException("This time slot is already booked.");
            }
        }

        Appointment appt = new Appointment();
        appt.setUser(client);
        appt.setLawyer(lawyer);
        appt.setAppointmentDate(date);
        appt.setTimeSlot(timeSlot);
        appt.setNotes(notes);
        appt.setConsultationFee(lawyer.getConsultationFee());
        appt.setStatus("PENDING");
        appt.setIsPaid(false);

        Appointment saved = appointmentRepository.save(appt);

        // Notify lawyer
        Notification notif = new Notification();
        notif.setUser(lawyer.getUser());
        notif.setTitle("New Appointment Request");
        notif.setMessage(client.getFirstName() + " has requested a consultation on " + date + " at " + timeSlot);
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);

        // Send email to lawyer
        sendEmail(lawyer.getUser().getEmail(), "New Appointment Request", 
                "Hi " + lawyer.getUser().getFirstName() + ", you have a new pending appointment request from " +
                client.getFirstName() + " for " + date + " at " + timeSlot + ".");

        return saved;
    }

    @Transactional
    public Appointment updateStatus(Long appointmentId, String status) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found."));
        appt.setStatus(status.toUpperCase());

        if ("APPROVED".equalsIgnoreCase(status)) {
            // Generate Jitsi Meeting Room Name
            String roomName = "CitizenLex-Consultation-" + UUID.randomUUID().toString().substring(0, 8);
            String jitsiUrl = "https://meet.jit.si/" + roomName;
            appt.setMeetingUrl(jitsiUrl);

            // Log meeting
            VideoMeeting meeting = new VideoMeeting();
            meeting.setAppointment(appt);
            meeting.setMeetingRoomName(roomName);
            meeting.setStartTime(LocalDateTime.now());
            meeting.setStatus("ACTIVE");
            videoMeetingRepository.save(meeting);

            // Notify client
            Notification cNotif = new Notification();
            cNotif.setUser(appt.getUser());
            cNotif.setTitle("Appointment Approved");
            cNotif.setMessage("Your consultation with Advocate " + appt.getLawyer().getUser().getFirstName() + " is approved.");
            cNotif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(cNotif);

            // Email client
            sendEmail(appt.getUser().getEmail(), "Appointment Approved", 
                    "Hi " + appt.getUser().getFirstName() + ", your appointment with Advocate " + 
                    appt.getLawyer().getUser().getFirstName() + " on " + appt.getAppointmentDate() + 
                    " at " + appt.getTimeSlot() + " has been approved. Join here: " + jitsiUrl);
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            Notification cNotif = new Notification();
            cNotif.setUser(appt.getUser());
            cNotif.setTitle("Appointment Rejected");
            cNotif.setMessage("Your consultation request with Advocate " + appt.getLawyer().getUser().getFirstName() + " was rejected.");
            cNotif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(cNotif);
        }

        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment reschedule(Long appointmentId, LocalDate newDate, String newSlot) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found."));
        
        appt.setAppointmentDate(newDate);
        appt.setTimeSlot(newSlot);
        appt.setStatus("PENDING");
        appointmentRepository.save(appt);

        // Notify lawyer
        Notification notif = new Notification();
        notif.setUser(appt.getLawyer().getUser());
        notif.setTitle("Appointment Rescheduled");
        notif.setMessage(appt.getUser().getFirstName() + " rescheduled their appointment to " + newDate + " at " + newSlot);
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);

        return appt;
    }

    // --- Razorpay Mock Payments Integration ---
    @Transactional
    public Appointment initiatePayment(Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found."));
        appt.setRazorpayOrderId("order_" + UUID.randomUUID().toString().substring(0, 12));
        return appointmentRepository.save(appt);
    }

    @Transactional
    public Appointment completePayment(Long appointmentId, String paymentId) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found."));
        appt.setIsPaid(true);
        appt.setRazorpayPaymentId(paymentId);
        appt.setStatus("APPROVED"); // Auto-approve on successful payment

        // Generate Jitsi Meeting Room Name
        String roomName = "CitizenLex-Consultation-" + UUID.randomUUID().toString().substring(0, 8);
        String jitsiUrl = "https://meet.jit.si/" + roomName;
        appt.setMeetingUrl(jitsiUrl);

        VideoMeeting meeting = new VideoMeeting();
        meeting.setAppointment(appt);
        meeting.setMeetingRoomName(roomName);
        meeting.setStartTime(LocalDateTime.now());
        meeting.setStatus("ACTIVE");
        videoMeetingRepository.save(meeting);

        Notification cNotif = new Notification();
        cNotif.setUser(appt.getUser());
        cNotif.setTitle("Payment Successful");
        cNotif.setMessage("Payment completed for consultation with Advocate " + appt.getLawyer().getUser().getFirstName() + ".");
        cNotif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(cNotif);

        return appointmentRepository.save(appt);
    }

    private void sendEmail(String toEmail, String subject, String body) {
        try {
            String html = "<div style='font-family:sans-serif;color:#333;padding:20px;'>" +
                    "<h2>CitizenLex Marketplace Alerts</h2>" +
                    "<p>" + body + "</p>" +
                    "</div>";
            emailService.sendAppointmentNotification(toEmail, subject, html);
        } catch (Exception e) {
            System.err.println("Email fail to " + toEmail + ": " + e.getMessage());
        }
    }
}
