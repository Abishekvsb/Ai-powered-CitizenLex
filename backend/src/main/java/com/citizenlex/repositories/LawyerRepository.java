package com.citizenlex.repositories;

import com.citizenlex.entities.Lawyer;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.util.Optional;

public interface LawyerRepository extends JpaRepository<Lawyer, Long>, JpaSpecificationExecutor<Lawyer> {
    Optional<Lawyer> findByUser(User user);
    Optional<Lawyer> findByAdvocateId(String advocateId);
    List<Lawyer> findByIsVerified(Boolean isVerified);
    List<Lawyer> findByVerificationStatus(String status);
}
