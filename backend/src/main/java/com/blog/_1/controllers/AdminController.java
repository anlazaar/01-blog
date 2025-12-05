package com.blog._1.controllers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blog._1.dto.user.AdminUserDTO;
import com.blog._1.dto.post.PostResponse; // Use your existing PostResponse!
import com.blog._1.models.User;
import com.blog._1.services.PostService;
import com.blog._1.services.ReportService;
import com.blog._1.services.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ReportService reportService;
    private final PostService postService;

    // ====================
    // USERS
    // ====================

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();

        // Convert User Entity -> AdminUserDTO
        List<AdminUserDTO> dtos = users.stream()
                .map(AdminUserDTO::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<String> banUser(@PathVariable UUID id) {
        userService.banUser(id);
        return ResponseEntity.ok("User banned");
    }


    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted");
    }

    // ====================
    // POSTS
    // ====================

    @GetMapping("/posts")
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        // Assuming postService.getAll() returns List<Post>
        // We use your existing PostResponse.from() method

        return ResponseEntity.ok(
                postService.getAll());
    }

    // ====================
    // REPORTS
    // ====================

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        // You might need a DTO for reports too if they cause recursion,
        // but for now, let's see if the User/Post fix handles it.
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<String> resolveReport(@PathVariable UUID id) {
        reportService.resolveReport(id);
        return ResponseEntity.ok("Report marked as resolved");
    }
}