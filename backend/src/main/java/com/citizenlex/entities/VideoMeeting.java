package com.citizenlex.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_meetings")
public class VideoMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(name = "meeting_room_name", nullable = false, length = 150)
    private String meetingRoomName;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, ENDED

    public VideoMeeting() {
        this.status = "ACTIVE";
        this.startTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getMeetingRoomName() { return meetingRoomName; }
    public void setMeetingRoomName(String meetingRoomName) { this.meetingRoomName = meetingRoomName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
