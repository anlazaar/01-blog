package com.blog._1.config;

import java.nio.file.AccessDeniedException;
import java.security.SignatureException;
import java.util.HashMap;
import java.util.Map;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Validation errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // Access Denied
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access Denied: You don't have permission"));
    }

    // Invalid arguments
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleInvalidCredentials(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    // JWT Errors
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<?> handleExpiredJwt(ExpiredJwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Token expired"));
    }

    @ExceptionHandler(MalformedJwtException.class)
    public ResponseEntity<?> handleMalformedJwt(MalformedJwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid token format"));
    }

    @ExceptionHandler(SignatureException.class)
    public ResponseEntity<?> handleJwtSignature(SignatureException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid token signature"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(DataIntegrityViolationException ex) {

        Throwable root = ex.getRootCause();
        String message = root != null ? root.getMessage() : ex.getMessage();

        // Genrale, needs more work to specify the duplicate
        if (message != null && message.contains("duplicate")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Value already exists (possibly email)"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Database constraint violation"));
    }

    // Hibernate-level constraint errors
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleHibernateConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Database constraint error: " + ex.getMessage()));
    }

    // Custom runtime errors
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    // Fallback for any other error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobal(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unexpected server error: " + ex.getMessage()));
    }
}
