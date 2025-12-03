package com.blog._1.dto.report;

import java.util.UUID;

import lombok.Data;

@Data
public class ReportCreateRequest {
    private UUID reportedUserId;
    private String reason;
}
