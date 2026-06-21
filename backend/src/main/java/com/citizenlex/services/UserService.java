package com.citizenlex.services;

import com.citizenlex.entities.Role;
import com.citizenlex.entities.User;
import com.citizenlex.repositories.RoleRepository;
import com.citizenlex.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private LogService logService;

    @Transactional
    public User registerUser(User user, String roleName) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email address already in use.");
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Assign role
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role " + roleName + " not found."));
        roles.add(userRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        
        logService.logActivity(savedUser, "REGISTER", "User registered successfully with role: " + roleName);
        return savedUser;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional
    public User updateProfile(Long id, String firstName, String lastName, String password) {
        User user = findById(id);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        User updatedUser = userRepository.save(user);
        logService.logActivity(updatedUser, "UPDATE_PROFILE", "User updated profile details");
        return updatedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findById(id);
        userRepository.delete(user);
        logService.logActivity((User) null, "DELETE_USER", "Deleted user with email: " + user.getEmail());
    }

    @Transactional
    public User changeUserRole(Long userId, String roleName) {
        User user = findById(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role " + roleName + " not found."));
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        
        User updatedUser = userRepository.save(user);
        logService.logActivity(updatedUser, "CHANGE_ROLE", "Admin changed user role to: " + roleName);
        return updatedUser;
    }
}
