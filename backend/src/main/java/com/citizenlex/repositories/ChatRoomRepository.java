package com.citizenlex.repositories;

import com.citizenlex.entities.ChatRoom;
import com.citizenlex.entities.Lawyer;
import com.citizenlex.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByUserAndLawyer(User user, Lawyer lawyer);
    List<ChatRoom> findByUser(User user);
    List<ChatRoom> findByLawyer(Lawyer lawyer);
}
