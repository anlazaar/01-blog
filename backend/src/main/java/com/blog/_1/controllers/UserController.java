package com.blog._1.controllers;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.dto.user.UserResponse;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================
    // Public routes
    // ========================

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserFullData(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getFullUserData(userService.getUserById(id)));
    }

    // View public user block/profile
    @GetMapping("/{id}/block")
    public ResponseEntity<UserPublicProfileDTO> getUserBlock(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getPublicProfile(userService.getUserById(id)));
    }

    // ========================
    // Authenticated user routes
    // ========================

    @PutMapping("/{id}")
    public ResponseEntity<User> updateFullUserInfo(@PathVariable UUID id, @Valid @RequestBody User newUserInfo) {
        newUserInfo.setRole(newUserInfo.getRole()); // keep role update secure if needed
        return ResponseEntity.ok(userService.updateUser(id, newUserInfo));
    }

    @PatchMapping("/profile/update/{id}")
    public ResponseEntity<?> updateProfileWithAvatar(
            @PathVariable UUID id,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "oldpassword", required = false) String oldpassword,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "firstname", required = false) String firstname,
            @RequestParam(value = "lastname", required = false) String lastname,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar) throws IOException {

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID currentUserId = currentUser.getId();

        if (!id.equals(currentUserId) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        return ResponseEntity.ok()
                .body(Map.of("res", userService.patchUser(currentUserId, firstname, lastname, bio, avatar, email,
                        password, oldpassword, username)));

    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserPublicProfileDTO>> getSuggestedUsers() {
        User currentUser = null;
        try {
            currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } catch (Exception e) {
            // User might be anonymous
        }

        UUID currentId = (currentUser != null) ? currentUser.getId() : null;
        return ResponseEntity.ok(userService.getSuggestedUsers(currentId));
    }

    @GetMapping("/explore")
    public ResponseEntity<List<UserPublicProfileDTO>> getAllUsers() {
        User currentUser = null;
        try {
            currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } catch (Exception e) {
            // User anonymous
        }
        UUID currentId = (currentUser != null) ? currentUser.getId() : null;

        return ResponseEntity.ok(userService.getAllPublicUsers(currentId));
    }
}
