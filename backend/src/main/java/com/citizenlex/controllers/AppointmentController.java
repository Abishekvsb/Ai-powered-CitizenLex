package com.citizenlex.controllers;

import com.citizenlex.entities.*;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.AppointmentService;
import com.citizenlex.services.LawyerService;
import com.citizenlex.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserService userService;

    @Autowired
    private LawyerService lawyerService;

    /**
     * GET /api/appointments/user — Get consultations for client.
     */
    @GetMapping("/user")
    public ResponseEntity<?> getClientAppointments() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());
        List<Appointment> appointments = appointmentService.getAppointmentsForUser(user);
        return ResponseEntity.ok(appointments);
    }

    /**
     * GET /api/appointments/lawyer — Get consultations for lawyer.
     */
    @GetMapping("/lawyer")
    public ResponseEntity<?> getLawyerAppointments() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());
        
        Optional<Lawyer> lawyer = lawyerService.getLawyerByUser(user);
        if (lawyer.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "User is not registered as a lawyer."));
        }

        List<Appointment> appointments = appointmentService.getAppointmentsForLawyer(lawyer.get());
        return ResponseEntity.ok(appointments);
    }

    /**
     * POST /api/appointments/book — Request booking slot.
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            Long lawyerId = Long.valueOf(req.get("lawyerId").toString());
            LocalDate date = LocalDate.parse(req.get("appointmentDate").toString());
            String slot = (String) req.get("timeSlot");
            String notes = (String) req.get("notes");

            Appointment appt = appointmentService.bookAppointment(user, lawyerId, date, slot, notes);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/appointments/{id}/status — Update booking status.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            Appointment appt = appointmentService.updateStatus(id, status);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/appointments/{id}/reschedule — Reschedule slot request.
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            LocalDate date = LocalDate.parse(req.get("appointmentDate").toString());
            String slot = (String) req.get("timeSlot");
            Appointment appt = appointmentService.reschedule(id, date, slot);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Simulated Razorpay hooks ---
    @PostMapping("/{id}/payment/initiate")
    public ResponseEntity<?> initiatePayment(@PathVariable Long id) {
        try {
            Appointment appt = appointmentService.initiatePayment(id);
            return ResponseEntity.ok(Map.of(
                    "orderId", appt.getRazorpayOrderId(),
                    "fee", appt.getConsultationFee(),
                    "currency", "INR"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/payment/complete")
    public ResponseEntity<?> completePayment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String paymentId = payload.get("paymentId");
            Appointment appt = appointmentService.completePayment(id, paymentId);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UserPrincipal getAuthenticatedPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return (UserPrincipal) auth.getPrincipal();
    }
}
