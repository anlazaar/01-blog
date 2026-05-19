package com.blog._1.dto.report;

import java.util.UUID;

import com.blog._1.models.ReportType;

import lombok.Data;

@Data
public class ReportCreateRequest {

    private String reason;

    private ReportType type;

    private UUID reportedUserId;

    private UUID reportedPostId;
}