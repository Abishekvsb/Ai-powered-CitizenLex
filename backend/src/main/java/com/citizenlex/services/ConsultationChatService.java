package com.citizenlex.services;

import com.citizenlex.entities.*;
import com.citizenlex.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ConsultationChatService {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private LawyerRepository lawyerRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoom getOrCreateRoom(User user, Long lawyerId) {
        Lawyer lawyer = lawyerRepository.findById(lawyerId)
                .orElseThrow(() -> new RuntimeException("Lawyer not found."));

        Optional<ChatRoom> existing = chatRoomRepository.findByUserAndLawyer(user, lawyer);
        return existing.orElseGet(() -> chatRoomRepository.save(new ChatRoom(user, lawyer)));
    }

    public List<ChatRoom> getUserRooms(User user) {
        return chatRoomRepository.findByUser(user);
    }

    public List<ChatRoom> getLawyerRooms(Lawyer lawyer) {
        return chatRoomRepository.findByLawyer(lawyer);
    }

    public List<ChatMessage> getRoomMessages(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found."));
        return chatMessageRepository.findByChatRoomOrderByCreatedAtAsc(room);
    }

    @Transactional
    public ChatMessage sendMessage(Long roomId, User sender, String text, String imageUrl, String fileUrl) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found."));

        ChatMessage msg = new ChatMessage();
        msg.setChatRoom(room);
        msg.setSender(sender);
        msg.setMessage(text);
        msg.setImageUrl(imageUrl);
        msg.setFileUrl(fileUrl);
        msg.setCreatedAt(LocalDateTime.now());
        msg.setIsRead(false);

        ChatMessage saved = chatMessageRepository.save(msg);

        // Broadcast to WebSocket STOMP topic subscribers
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);

        return saved;
    }

    @Transactional
    public void markAsRead(Long roomId, User reader) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found."));

        List<ChatMessage> messages = chatMessageRepository.findByChatRoomOrderByCreatedAtAsc(room);
        for (ChatMessage msg : messages) {
            if (!msg.getSender().getId().equals(reader.getId()) && !msg.getIsRead()) {
                msg.setIsRead(true);
                chatMessageRepository.save(msg);
            }
        }

        // Broadcast read receipt update to room
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/read", "READ");
    }

    public void sendTypingIndicator(Long roomId, String senderName, Boolean isTyping) {
        String status = isTyping ? "TYPING" : "IDLE";
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", 
                new TypingStatus(senderName, status));
    }

    // Static class for STOMP typing payload
    public static class TypingStatus {
        private String sender;
        private String status;

        public TypingStatus(String sender, String status) {
            this.sender = sender;
            this.status = status;
        }
        public String getSender() { return sender; }
        public String getStatus() { return status; }
    }
}
