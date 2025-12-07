package com.blog._1.dto.admin;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalPosts;
    private long pendingReports;


    private List<ChartDataPoint> userGrowth; // Last 7 days
    private List<ChartDataPoint> postGrowth; // Last 7 days
}