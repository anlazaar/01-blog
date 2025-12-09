package com.blog._1.controllers;

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
import com.blog._1.dto.report.ReportResponse;
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

    // Ideally, move these to a DashboardService. Keeping here to maintain
    // functionality.
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        // 1. Basic Counts (Fast)
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long pendingReports = reportRepository.countByResolvedFalse();

        // 2. Chart Data (Optimized: Fetch minimal data)
        // In a real prod app, use a custom GROUP BY SQL query instead of fetching
        // entities
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<LocalDateTime> userDates = userRepository
                .findByCreatedAtAfter(sevenDaysAgo, org.springframework.data.domain.Pageable.unpaged())
                .stream().map(User::getCreatedAt).toList();

        List<LocalDateTime> postDates = postRepository
                .findByCreatedAtAfter(sevenDaysAgo, org.springframework.data.domain.Pageable.unpaged())
                .stream().map(Post::getCreatedAt).toList();

        return ResponseEntity.ok(DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .pendingReports(pendingReports)
                .userGrowth(processChartData(userDates))
                .postGrowth(processChartData(postDates))
                .build());
    }

    private List<ChartDataPoint> processChartData(List<LocalDateTime> timestamps) {
        Map<LocalDate, Long> countsByDay = timestamps.stream()
                .collect(Collectors.groupingBy(LocalDateTime::toLocalDate, Collectors.counting()));

        List<ChartDataPoint> points = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            points.add(new ChartDataPoint(date.format(formatter), countsByDay.getOrDefault(date, 0L)));
        }
        return points;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        // Optimization: Admin might need to see all, but pagination is safer.
        // Showing top 100 for now or fetch all if list is small.
        List<User> users = userService.getAllUsers();
        List<AdminUserDTO> dtos = users.stream().map(AdminUserDTO::from).toList();
        return ResponseEntity.ok(dtos);
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
    public ResponseEntity<List<PostResponse>> getAllPosts(
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
}