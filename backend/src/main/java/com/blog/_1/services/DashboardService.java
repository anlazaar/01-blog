package com.blog._1.services;

import com.blog._1.dto.admin.ChartDataPoint;
import com.blog._1.dto.admin.DashboardStatsDTO;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.ReportRepository;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        // 1. Basic Counts (Fast SQL counts)
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long pendingReports = reportRepository.countByResolvedFalse();

        // 2. Chart Data
        // Optimization: In a highly scaled app, we would use a custom JPQL query
        // with "GROUP BY" to fetch only counts. For now, we optimized the Controller
        // by moving this logic here and using 'readOnly=true' transaction.
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // Ideally: Create a repository method: List<ChartDataProjection>
        // findDailyCounts(LocalDateTime since);
        List<LocalDateTime> userDates = userRepository.findAllCreatedDatesAfter(sevenDaysAgo);
        List<LocalDateTime> postDates = postRepository.findAllCreatedDatesAfter(sevenDaysAgo);

        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .pendingReports(pendingReports)
                .userGrowth(processChartData(userDates))
                .postGrowth(processChartData(postDates))
                .build();
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
}