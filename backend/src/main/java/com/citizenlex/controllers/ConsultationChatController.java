package com.citizenlex.controllers;

import com.citizenlex.entities.*;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.ConsultationChatService;
import com.citizenlex.services.LawyerService;
import com.citizenlex.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/consultation/chat")
public class ConsultationChatController {

    @Autowired
    private ConsultationChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private LawyerService lawyerService;

    /**
     * GET /api/consultation/chat/rooms — List chat rooms for currently authenticated user.
     */
    @GetMapping("/rooms")
    public ResponseEntity<?> getMyRooms() {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        // Check if user is registered as a lawyer to return lawyer-specific rooms, else client rooms
        Optional<Lawyer> lawyer = lawyerService.getLawyerByUser(user);
        if (lawyer.isPresent() && lawyer.get().getIsVerified()) {
            return ResponseEntity.ok(chatService.getLawyerRooms(lawyer.get()));
        } else {
            return ResponseEntity.ok(chatService.getUserRooms(user));
        }
    }

    /**
     * POST /api/consultation/chat/rooms/initiate — Open/Get room with lawyer.
     */
    @PostMapping("/rooms/initiate")
    public ResponseEntity<?> getOrCreateRoom(@RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            Long lawyerId = Long.valueOf(req.get("lawyerId").toString());
            ChatRoom room = chatService.getOrCreateRoom(user, lawyerId);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/consultation/chat/rooms/{roomId}/messages — Get message logs.
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> getRoomMessages(@PathVariable Long roomId) {
        try {
            List<ChatMessage> messages = chatService.getRoomMessages(roomId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/consultation/chat/send — Send chat message REST fallback.
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> req) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            Long roomId = Long.valueOf(req.get("roomId").toString());
            String text = (String) req.get("message");
            String img = (String) req.get("imageUrl");
            String doc = (String) req.get("fileUrl");

            ChatMessage message = chatService.sendMessage(roomId, user, text, img, doc);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/consultation/chat/read/{roomId} — Mark all messages read.
     */
    @PutMapping("/read/{roomId}")
    public ResponseEntity<?> markRead(@PathVariable Long roomId) {
        UserPrincipal principal = getAuthenticatedPrincipal();
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userService.findById(principal.getId());

        try {
            chatService.markAsRead(roomId, user);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- WebSocket STOMP Typing Handlers ---
    @MessageMapping("/chat/typing/{roomId}")
    public void handleTypingNotification(@DestinationVariable Long roomId, @Payload Map<String, Object> payload) {
        try {
            String name = (String) payload.get("senderName");
            Boolean isTyping = (Boolean) payload.get("isTyping");
            chatService.sendTypingIndicator(roomId, name, isTyping);
        } catch (Exception e) {
            System.err.println("Typing indicator err: " + e.getMessage());
        }
    }

    private UserPrincipal getAuthenticatedPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return (UserPrincipal) auth.getPrincipal();
    }
}
