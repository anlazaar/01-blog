package com.blog._1.controllers;

import com.blog._1.dto.user.ProfilePatchRequest;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.dto.user.UserResponse;
import com.blog._1.dto.user.UserUpdateRequest;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // --- Static routes FIRST ---

    @GetMapping("/suggested")
    public ResponseEntity<List<UserPublicProfileDTO>> getSuggestedUsers(
            @AuthenticationPrincipal User currentUser) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(userService.getSuggestedUsers(currentUserId));
    }

    @GetMapping("/explore")
    public ResponseEntity<Page<UserPublicProfileDTO>> getAllUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(
                userService.getAllPublicUsers(currentUserId, PageRequest.of(page, size)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserPublicProfileDTO>> searchUsers(
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(userService.searchUsers(q, currentUserId, page, size));
    }

    @PatchMapping("/profile/update/{id}")
    public ResponseEntity<Map<String, String>> updateProfileWithAvatar(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser,
            @Valid @ModelAttribute ProfilePatchRequest requestDTO) throws IOException {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!id.equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String result = userService.patchUser(id, requestDTO);
        return ResponseEntity.ok(Map.of("res", result));
    }

    // --- Dynamic UUID routes AFTER static routes ---

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserFullData(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!currentUser.getId().equals(id) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User targetUser = currentUser.getId().equals(id)
                ? currentUser
                : userService.getUserById(id);

        return ResponseEntity.ok(userService.getFullUserData(targetUser));
    }

    @GetMapping("/{id}/block")
    public ResponseEntity<UserPublicProfileDTO> getUserBlock(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getPublicProfile(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateFullUserInfo(
            @PathVariable UUID id,
            @Valid @RequestBody UserUpdateRequest requestDTO,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!currentUser.getId().equals(id) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User updatedUser = userService.updateUser(id, requestDTO);
        return ResponseEntity.ok(userService.getFullUserData(updatedUser));
    }
}