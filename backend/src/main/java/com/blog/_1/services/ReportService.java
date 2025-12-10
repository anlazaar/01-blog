package com.blog._1.services;

import com.blog._1.dto.report.ReportCreateRequest;
import com.blog._1.dto.report.ReportResponse;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.Report;
import com.blog._1.models.User;
import com.blog._1.repositories.ReportRepository;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportResponse createReport(ReportCreateRequest req) {
        User reporter = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // Optimization: Use Reference
        User reportedUser = userRepository.getReferenceById(req.getReportedUserId());

        Report report = new Report();
        report.setReason(req.getReason());
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);

        return toResponse(reportRepository.save(report));
    }

    // OPTIMIZATION: Pagination
    public List<ReportResponse> getAllReports(int page, int size) {
        return reportRepository.findAll(PageRequest.of(page, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteReport(UUID id) {
        reportRepository.deleteById(id);
    }

    public void resolveReport(UUID id) {
        Report report = reportRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        report.setResolved(true);
        reportRepository.save(report);
    }

    private ReportResponse toResponse(Report r) {
        ReportResponse dto = new ReportResponse();
        dto.setId(r.getId());
        dto.setReason(r.getReason());
        dto.setResolved(r.isResolved());
        dto.setCreatedAt(
                r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        dto.setReporter(toUserDTO(r.getReporter()));
        dto.setReportedUser(toUserDTO(r.getReportedUser()));
        return dto;
    }

    private UserPublicProfileDTO toUserDTO(User u) {
        // Because of Lazy Loading (getReferenceById), we must be careful here.
        // If we access properties of a proxy that doesn't exist, it crashes.
        // However, usually we want to display the info, so Hibernate will fetch it
        // here.
        if (u == null)
            return null;
        UserPublicProfileDTO dto = new UserPublicProfileDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername()); // Triggers fetch
        dto.setAvatarUrl(u.getAvatarUrl());
        return dto;
    }
}