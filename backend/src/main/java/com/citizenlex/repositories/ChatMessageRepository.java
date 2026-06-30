package com.citizenlex.repositories;

import com.citizenlex.entities.ChatMessage;
import com.citizenlex.entities.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoomOrderByCreatedAtAsc(ChatRoom chatRoom);
    Long countByChatRoomAndIsReadFalse(ChatRoom chatRoom);
}
