package com.citizenlex.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Reviewer

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lawyer_id", nullable = false)
    private Lawyer lawyer; // Advocate reviewed

    @Column(nullable = false)
    private Integer rating; // 1 to 5

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "helpful_votes")
    private Integer helpfulVotes = 0;

    @Column(name = "is_verified_consultation")
    private Boolean isVerifiedConsultation = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Review() {
        this.helpfulVotes = 0;
        this.isVerifiedConsultation = true;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Lawyer getLawyer() { return lawyer; }
    public void setLawyer(Lawyer lawyer) { this.lawyer = lawyer; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getHelpfulVotes() { return helpfulVotes; }
    public void setHelpfulVotes(Integer helpfulVotes) { this.helpfulVotes = helpfulVotes; }

    public Boolean getIsVerifiedConsultation() { return isVerifiedConsultation != null && isVerifiedConsultation; }
    public void setIsVerifiedConsultation(Boolean isVerifiedConsultation) { this.isVerifiedConsultation = isVerifiedConsultation; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
