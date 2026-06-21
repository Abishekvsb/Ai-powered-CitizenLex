package com.citizenlex.controllers;

import com.citizenlex.dtos.JwtAuthenticationResponse;
import com.citizenlex.dtos.LoginRequest;
import com.citizenlex.dtos.RegisterRequest;
import com.citizenlex.dtos.UserDto;
import com.citizenlex.entities.User;
import com.citizenlex.security.JwtTokenProvider;
import com.citizenlex.security.UserPrincipal;
import com.citizenlex.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = new User(
                registerRequest.getEmail(),
                registerRequest.getPassword(),
                registerRequest.getFirstName(),
                registerRequest.getLastName()
        );

        User registered = userService.registerUser(user, "ROLE_USER");
        
        UserDto userDto = new UserDto(
                registered.getId(),
                registered.getEmail(),
                registered.getFirstName(),
                registered.getLastName(),
                "ROLE_USER",
                registered.getCreatedAt()
        );

        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String role = userPrincipal.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority())
                .orElse("ROLE_USER");

        UserDto userDto = new UserDto(
                userPrincipal.getId(),
                userPrincipal.getEmail(),
                userPrincipal.getFirstName(),
                userPrincipal.getLastName(),
                role,
                null // Creation date omitted in login payload for convenience
        );

        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(410).body("User not authenticated");
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userService.findById(principal.getId());

        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName())
                .orElse("ROLE_USER");

        UserDto userDto = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                role,
                user.getCreatedAt()
        );

        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestParam(required = false) String password,
                                           @RequestParam String firstName,
                                           @RequestParam String lastName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        
        User updated = userService.updateProfile(principal.getId(), firstName, lastName, password);
        
        String role = updated.getRoles().stream()
                .findFirst()
                .map(r -> r.getName())
                .orElse("ROLE_USER");

        UserDto userDto = new UserDto(
                updated.getId(),
                updated.getEmail(),
                updated.getFirstName(),
                updated.getLastName(),
                role,
                updated.getCreatedAt()
        );

        return ResponseEntity.ok(userDto);
    }
}
