package com.citizenlex.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "review_votes")
public class ReviewVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(name = "is_upvote")
    private Boolean isUpvote = true;

    public ReviewVote() {}

    public ReviewVote(User user, Review review, Boolean isUpvote) {
        this.user = user;
        this.review = review;
        this.isUpvote = isUpvote;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }

    public Boolean getIsUpvote() { return isUpvote != null && isUpvote; }
    public void setIsUpvote(Boolean isUpvote) { this.isUpvote = isUpvote; }
}
