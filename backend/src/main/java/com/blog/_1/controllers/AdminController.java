package com.blog._1.controllers;

// 1. ALL NECESSARY IMPORTS
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blog._1.dto.user.AdminUserDTO;
import com.blog._1.dto.admin.ChartDataPoint;
import com.blog._1.dto.admin.DashboardStatsDTO;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.models.User;
import com.blog._1.models.Post;
import com.blog._1.services.PostService;
import com.blog._1.services.ReportService;
import com.blog._1.services.UserService;
import com.blog._1.repositories.UserRepository;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.ReportRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ReportService reportService;
    private final PostService postService;

    // Inject Repositories for analytics
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;

    // ====================
    // ANALYTICS (FIXED)
    // ====================
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {

        // 1. Basic Counts
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long pendingReports = reportRepository.countByResolvedFalse();

        // 2. Chart Data (Last 7 Days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // Get raw data for last 7 days
        List<User> recentUsers = userRepository.findAllByCreatedAtAfter(sevenDaysAgo);
        List<Post> recentPosts = postRepository.findAllByCreatedAtAfter(sevenDaysAgo);

        // Convert Entities to Dates
        List<LocalDateTime> userDates = recentUsers.stream().map(User::getCreatedAt).collect(Collectors.toList());
        List<LocalDateTime> postDates = recentPosts.stream().map(Post::getCreatedAt).collect(Collectors.toList());

        return ResponseEntity.ok(DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .pendingReports(pendingReports)
                .userGrowth(processChartData(userDates))
                .postGrowth(processChartData(postDates))
                .build());
    }

    /**
     * Correctly fills the last 7 days (even if count is 0) and sorts
     * chronologically.
     */
    private List<ChartDataPoint> processChartData(List<LocalDateTime> timestamps) {
        // 1. Group by LocalDate
        Map<LocalDate, Long> countsByDay = timestamps.stream()
                .collect(Collectors.groupingBy(
                        LocalDateTime::toLocalDate,
                        Collectors.counting()));

        List<ChartDataPoint> points = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        // 2. Loop specifically from 6 days ago to Today (Chronological Order)
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);

            // Get count or 0
            long count = countsByDay.getOrDefault(date, 0L);

            // Add to list
            points.add(new ChartDataPoint(date.format(formatter), count));
        }

        return points;
    }

    // ====================
    // USERS
    // ====================

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();
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
        return ResponseEntity.ok(postService.getAll());
    }

    // ====================
    // REPORTS
    // ====================

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PatchMapping("/reports/{id}/resolve")
    public ResponseEntity<String> resolveReport(@PathVariable UUID id) {
        reportService.resolveReport(id);
        return ResponseEntity.ok("Report marked as resolved");
    }
}