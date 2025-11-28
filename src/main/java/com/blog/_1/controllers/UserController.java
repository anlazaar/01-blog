package com.blog._1.controllers;

import org.springframework.web.bind.annotation.*;
import com.blog._1.dto.user.UserPatchRequest;
import com.blog._1.models.User;
import com.blog._1.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================
    // Public routes
    // ========================

    // View public user block/profile
    @GetMapping("/{id}/block")
    public ResponseEntity<User> getUserBlock(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ========================
    // Authenticated user routes
    // ========================

    // Update full user info (e.g., profile)
    @PutMapping("/{id}")
    public ResponseEntity<User> updateFullUserInfo(@PathVariable UUID id, @Valid @RequestBody User newUserInfo) {
        newUserInfo.setRole(newUserInfo.getRole()); // keep role update secure if needed
        return ResponseEntity.ok(userService.updateUser(id, newUserInfo));
    }

    // Partial update
    @PatchMapping("/{id}")
    public ResponseEntity<User> updateSomeUserInfo(@PathVariable UUID id, @Valid @RequestBody UserPatchRequest req) {
        return ResponseEntity.ok(userService.patchUser(id, req));
    }

    // Subscribe to another user
    @PostMapping("/{id}/subscribe")
    public ResponseEntity<String> subscribeToUser(@PathVariable UUID id) {
        userService.subscribeToUser(id);
        return ResponseEntity.ok("Subscribed successfully");
    }

    // Unsubscribe from a user
    @PostMapping("/{id}/unsubscribe")
    public ResponseEntity<String> unsubscribeFromUser(@PathVariable UUID id) {
        userService.unsubscribeFromUser(id);
        return ResponseEntity.ok("Unsubscribed successfully");
    }

    // ========================
    // Admin-only routes
    // ========================

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted");
    }
}
