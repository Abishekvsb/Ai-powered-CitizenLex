package com.citizenlex.repositories;

import com.citizenlex.entities.Appointment;
import com.citizenlex.entities.Lawyer;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUser(User user);
    List<Appointment> findByLawyer(Lawyer lawyer);
    List<Appointment> findByLawyerAndAppointmentDate(Lawyer lawyer, LocalDate date);
    List<Appointment> findByUserAndStatus(User user, String status);
    List<Appointment> findByLawyerAndStatus(Lawyer lawyer, String status);
    
    // Check completed count to verify review option
    Long countByUserAndLawyerAndStatus(User user, Lawyer lawyer, String status);
}
