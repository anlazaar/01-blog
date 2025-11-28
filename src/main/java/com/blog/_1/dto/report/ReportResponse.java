package com.blog._1.dto.report;

import java.util.UUID;

import com.blog._1.dto.user.UserPublicProfileDTO;

public class ReportResponse {
    private UUID id;
    private String reason;
    private boolean resolved;
    private String createdAt;

    private UserPublicProfileDTO reporter;
    private UserPublicProfileDTO reportedUser;
}
