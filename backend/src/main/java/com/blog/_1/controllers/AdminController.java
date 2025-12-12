package com.blog._1.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blog._1.dto.user.AdminUserDTO;
import com.blog._1.dto.admin.DashboardStatsDTO;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.dto.report.ReportResponse;
import com.blog._1.models.Role;
import com.blog._1.services.DashboardService; // New Service
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
    private final DashboardService dashboardService; // Injected new service

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        // Logic moved to DashboardService to use efficient SQL aggregation
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // Optimization: utilize pagination handled by the service
        // and map entities to DTOs
        return ResponseEntity.ok(userService.getAllUsers(page, size)
                .map(AdminUserDTO::from));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<String> banUser(@PathVariable UUID id) {
        userService.banUser(id);
        return ResponseEntity.ok("User status updated");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted");
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(postService.getAll(page, size));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponse>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reportService.getAllReports(page, size));
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<String> resolveReport(@PathVariable UUID id) {
        reportService.resolveReport(id);
        return ResponseEntity.ok("Report resolved");
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<String> updateUserRole(
            @PathVariable UUID id,
            @RequestParam Role role) {

        userService.updateUserRole(id, role);
        return ResponseEntity.ok("User role updated to " + role);
    }
}