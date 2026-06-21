package com.citizenlex.services;

import com.citizenlex.entities.ActivityLog;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.ActivityLogRepository;
import com.citizenlex.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LogService {

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void logActivity(User user, String action, String details) {
        ActivityLog log = new ActivityLog(user, action, details);
        logRepository.save(log);
    }

    @Transactional
    public void logActivity(String email, String action, String details) {
        User user = userRepository.findByEmail(email).orElse(null);
        ActivityLog log = new ActivityLog(user, action, details);
        logRepository.save(log);
    }

    public List<ActivityLog> getAllLogs() {
        return logRepository.findAllByOrderByTimestampDesc();
    }
}
