package com.citizenlex.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Client

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lawyer_id", nullable = false)
    private Lawyer lawyer; // Advocate

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public ChatRoom() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatRoom(User user, Lawyer lawyer) {
        this.user = user;
        this.lawyer = lawyer;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Lawyer getLawyer() { return lawyer; }
    public void setLawyer(Lawyer lawyer) { this.lawyer = lawyer; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
