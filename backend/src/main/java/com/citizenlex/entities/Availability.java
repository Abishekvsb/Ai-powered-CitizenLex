package com.citizenlex.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "availabilities")
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lawyer_id", nullable = false)
    private Lawyer lawyer;

    @Column(name = "day_of_week", nullable = false, length = 20)
    private String dayOfWeek; // Monday, Tuesday...

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime; // 09:00

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime; // 17:00

    @Column(name = "is_booked")
    private Boolean isBooked = false;

    public Availability() {
        this.isBooked = false;
    }

    public Availability(Lawyer lawyer, String dayOfWeek, String startTime, String endTime) {
        this.lawyer = lawyer;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isBooked = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lawyer getLawyer() { return lawyer; }
    public void setLawyer(Lawyer lawyer) { this.lawyer = lawyer; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public Boolean getIsBooked() { return isBooked != null && isBooked; }
    public void setIsBooked(Boolean isBooked) { this.isBooked = isBooked; }
}
