package com.citizenlex.repositories;

import com.citizenlex.entities.Appointment;
import com.citizenlex.entities.VideoMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VideoMeetingRepository extends JpaRepository<VideoMeeting, Long> {
    Optional<VideoMeeting> findByAppointment(Appointment appointment);
    Optional<VideoMeeting> findByMeetingRoomName(String roomName);
}
