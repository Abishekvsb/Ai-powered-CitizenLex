package com.citizenlex.controllers;

import com.citizenlex.dtos.ChatRequest;
import com.citizenlex.entities.ChatHistory;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatHistory> postMessage(@Valid @RequestBody ChatRequest chatRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        ChatHistory chat = chatService.generateAndSaveChat(
                principal.getId(),
                chatRequest.getMessage(),
                chatRequest.getLanguage()
        );

        return ResponseEntity.ok(chat);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            return ResponseEntity.status(401).body(null);
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<ChatHistory> historyPage = chatService.getUserChatHistory(principal.getId(), pageable);
            return ResponseEntity.ok(historyPage);
        } else {
            List<ChatHistory> history = chatService.getUserChatHistory(principal.getId());
            return ResponseEntity.ok(history);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        chatService.deleteChat(id, principal.getId());
        return ResponseEntity.ok().build();
    }
}
