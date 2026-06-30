package com.citizenlex.repositories;

import com.citizenlex.entities.Review;
import com.citizenlex.entities.ReviewVote;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReviewVoteRepository extends JpaRepository<ReviewVote, Long> {
    Optional<ReviewVote> findByUserAndReview(User user, Review review);
    Long countByReviewAndIsUpvote(Review review, Boolean isUpvote);
}
