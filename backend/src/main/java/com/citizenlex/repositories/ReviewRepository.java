package com.citizenlex.repositories;

import com.citizenlex.entities.Lawyer;
import com.citizenlex.entities.Review;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByLawyer(Lawyer lawyer);
    List<Review> findByLawyerOrderByCreatedAtDesc(Lawyer lawyer);
    Optional<Review> findByUserAndLawyer(User user, Lawyer lawyer);
}
