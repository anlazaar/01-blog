package com.blog._1.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChartDataPoint {
    private String label; // e.g., "Monday"
    private long value; // e.g., 15
}