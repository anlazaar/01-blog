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

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserFullData(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getFullUserData(userService.getUserById(id)));
    }

    @GetMapping("/{id}/block")
    public ResponseEntity<UserPublicProfileDTO> getUserBlock(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getPublicProfile(userService.getUserById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateFullUserInfo(@PathVariable UUID id, @Valid @RequestBody User newUserInfo) {
        // Warning: Role update should be protected in Service, keeping here as
        // requested
        return ResponseEntity.ok(userService.updateUser(id, newUserInfo));
    }

    @PatchMapping("/profile/update/{id}")
    public ResponseEntity<Map<String, String>> updateProfileWithAvatar(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String oldpassword,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String firstname,
            @RequestParam(required = false) String lastname,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) MultipartFile avatar) throws IOException {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!id.equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String result = userService.patchUser(id, firstname, lastname, bio, avatar, email, password, oldpassword,
                username);
        return ResponseEntity.ok(Map.of("res", result));
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserPublicProfileDTO>> getSuggestedUsers(@AuthenticationPrincipal User currentUser) {
        UUID currentUserId = (currentUser != null) ? currentUser.getId() : null;
        return ResponseEntity.ok(userService.getSuggestedUsers(currentUserId));
    }

    @GetMapping("/explore")
    public ResponseEntity<Page<UserPublicProfileDTO>> getAllUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UUID currentUserId = (currentUser != null) ? currentUser.getId() : null;

        return ResponseEntity.ok(userService.getAllPublicUsers(currentUserId, PageRequest.of(page, size)));
    }

    // Helper to safely get ID or null (for guest view)
    private UUID getSafeCurrentUserId() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof User) {
                return ((User) principal).getId();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}