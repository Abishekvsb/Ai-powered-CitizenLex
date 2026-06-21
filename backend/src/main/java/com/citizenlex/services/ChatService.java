package com.citizenlex.services;

import com.citizenlex.entities.ChatHistory;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.ChatHistoryRepository;
import com.citizenlex.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    @Autowired
    private ChatHistoryRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private LogService logService;

    @Transactional
    public ChatHistory generateAndSaveChat(Long userId, String message, String language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Call AI service
        String response = geminiService.getChatResponse(message, language);

        // Save to database
        ChatHistory chatHistory = new ChatHistory(user, message, response, language);
        ChatHistory savedChat = chatRepository.save(chatHistory);

        // Log activity
        logService.logActivity(user, "CHAT", "User asked: '" + 
                (message.length() > 50 ? message.substring(0, 47) + "..." : message) + "'");

        return savedChat;
    }

    public List<ChatHistory> getUserChatHistory(Long userId) {
        return chatRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Page<ChatHistory> getUserChatHistory(Long userId, Pageable pageable) {
        return chatRepository.findByUserId(userId, pageable);
    }

    @Transactional
    public void deleteChat(Long chatId, Long userId) {
        ChatHistory chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat history not found with id: " + chatId));
        
        if (!chat.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this chat entry.");
        }
        
        chatRepository.delete(chat);
    }
}
