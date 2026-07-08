package com.citizenlex.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /** Validation errors — surface every field-level message to the frontend */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Collect all field errors into a readable string
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        Map<String, String> body = new HashMap<>();
        body.put("error", message.isEmpty() ? "Validation failed" : message);
        // Also expose individual field errors for fine-grained frontend handling
        ex.getBindingResult().getFieldErrors().forEach(e -> body.put("field_" + e.getField(), e.getDefaultMessage()));
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /** Spring Security authentication errors (wrong password, user not found, etc.) */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Incorrect email or password. Please try again.");
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<?> handleDisabled(DisabledException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Your account has been disabled. Contact support.");
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<?> handleLocked(LockedException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Your account is locked. Contact support.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthentication(AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Authentication failed: " + ex.getMessage());
    }

    /** Business logic runtime errors (e.g. "Email already in use") */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeExceptions(RuntimeException ex) {
        String msg = ex.getMessage();
        // Distinguish 409 Conflict (duplicate email) from generic 400
        if (msg != null && (msg.contains("already in use") || msg.contains("already exists") || msg.contains("duplicate"))) {
            return error(HttpStatus.CONFLICT, msg);
        }
        return error(HttpStatus.BAD_REQUEST, msg != null ? msg : "An error occurred");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralExceptions(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again.");
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return new ResponseEntity<>(body, status);
    }
}
