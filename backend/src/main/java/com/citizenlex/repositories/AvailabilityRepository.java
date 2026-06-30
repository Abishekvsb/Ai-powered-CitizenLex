package com.citizenlex.repositories;

import com.citizenlex.entities.Availability;
import com.citizenlex.entities.Lawyer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    List<Availability> findByLawyer(Lawyer lawyer);
    List<Availability> findByLawyerAndDayOfWeek(Lawyer lawyer, String dayOfWeek);
    List<Availability> findByLawyerAndDayOfWeekAndIsBooked(Lawyer lawyer, String dayOfWeek, Boolean isBooked);
}
