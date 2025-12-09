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
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String oldpassword,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String firstname,
            @RequestParam(required = false) String lastname,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) MultipartFile avatar) throws IOException {

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!id.equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String result = userService.patchUser(id, firstname, lastname, bio, avatar, email, password, oldpassword,
                username);
        return ResponseEntity.ok(Map.of("res", result));
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserPublicProfileDTO>> getSuggestedUsers() {
        UUID currentId = getSafeCurrentUserId();
        return ResponseEntity.ok(userService.getSuggestedUsers(currentId));
    }

    @GetMapping("/explore")
    public ResponseEntity<List<UserPublicProfileDTO>> getAllUsers() {
        UUID currentId = getSafeCurrentUserId();
        // In the future, add Pagination here too
        return ResponseEntity.ok(userService.getAllPublicUsers(currentId));
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