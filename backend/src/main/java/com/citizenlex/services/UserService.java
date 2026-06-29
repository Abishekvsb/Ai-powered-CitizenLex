package com.citizenlex.services;

import com.citizenlex.dtos.ProfileUpdateRequest;
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

    /**
     * Legacy profile update (firstName, lastName, password only).
     * Kept for backward compat with existing /api/auth/profile endpoint.
     */
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

    /**
     * Full profile update with all extended fields.
     */
    @Transactional
    public User updateFullProfile(Long id, ProfileUpdateRequest req) {
        User user = findById(id);
        if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
            user.setFirstName(req.getFirstName());
        }
        if (req.getLastName() != null && !req.getLastName().isBlank()) {
            user.setLastName(req.getLastName());
        }
        if (req.getMobile() != null) user.setMobile(req.getMobile());
        if (req.getDateOfBirth() != null) user.setDateOfBirth(req.getDateOfBirth());
        if (req.getGender() != null) user.setGender(req.getGender());
        if (req.getState() != null) user.setState(req.getState());
        if (req.getDistrict() != null) user.setDistrict(req.getDistrict());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (req.getPreferredLanguage() != null) user.setPreferredLanguage(req.getPreferredLanguage());
        if (req.getOccupation() != null) user.setOccupation(req.getOccupation());
        User updatedUser = userRepository.save(user);
        logService.logActivity(updatedUser, "UPDATE_FULL_PROFILE", "User updated extended profile information");
        return updatedUser;
    }

    /**
     * Update the profile image URL and Cloudinary public ID for a user.
     */
    @Transactional
    public User updateProfileImage(Long id, String imageUrl, String cloudinaryPublicId) {
        User user = findById(id);
        user.setProfileImageUrl(imageUrl);
        user.setCloudinaryPublicId(cloudinaryPublicId);
        User updatedUser = userRepository.save(user);
        logService.logActivity(updatedUser, "UPDATE_PROFILE_IMAGE", "User updated profile photo");
        return updatedUser;
    }

    /**
     * Remove the profile image URL and Cloudinary public ID for a user.
     * Returns the old publicId so the caller can delete it from Cloudinary.
     */
    @Transactional
    public String removeProfileImage(Long id) {
        User user = findById(id);
        String oldPublicId = user.getCloudinaryPublicId();
        user.setProfileImageUrl(null);
        user.setCloudinaryPublicId(null);
        userRepository.save(user);
        logService.logActivity(user, "REMOVE_PROFILE_IMAGE", "User removed profile photo");
        return oldPublicId;
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

    /**
     * Generic save — used internally for login audit updates.
     */
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * Change password after verifying current password.
     */
    @Transactional
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = findById(id);
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logService.logActivity(user, "CHANGE_PASSWORD", "User changed password");
    }

    /**
     * Update notification preferences for a user.
     */
    @Transactional
    public User updateNotificationPreferences(Long id, Boolean emailNotifications, Boolean pushNotifications,
                                               Boolean reminderNotifications, Boolean marketingEmails,
                                               Boolean productUpdates) {
        User user = findById(id);
        if (emailNotifications != null) user.setEmailNotifications(emailNotifications);
        if (pushNotifications != null) user.setPushNotifications(pushNotifications);
        if (reminderNotifications != null) user.setReminderNotifications(reminderNotifications);
        if (marketingEmails != null) user.setMarketingEmails(marketingEmails);
        if (productUpdates != null) user.setProductUpdates(productUpdates);
        return userRepository.save(user);
    }

    /**
     * Delete account and log the action.
     */
    @Transactional
    public void deleteAccount(Long id, String password) {
        User user = findById(id);
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Password is incorrect.");
        }
        userRepository.delete(user);
        logService.logActivity((User) null, "DELETE_ACCOUNT", "User deleted account: " + user.getEmail());
    }
}

