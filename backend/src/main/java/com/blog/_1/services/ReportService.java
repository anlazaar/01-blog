package com.blog._1.services;

import com.blog._1.dto.report.ReportCreateRequest;
import com.blog._1.dto.report.ReportResponse;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.Report;
import com.blog._1.models.User;
import com.blog._1.repositories.ReportRepository;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
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

    // -----------------------------
    // CREATE REPORT
    // -----------------------------
    public ReportResponse createReport(ReportCreateRequest req) {

        Object principal = SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        if (!(principal instanceof User)) {
            throw new RuntimeException("Unauthorized");
        }

        User reporter = (User) principal;

        User reportedUser = userRepository.findById(req.getReportedUserId())
                .orElseThrow(() -> new RuntimeException("Reported user not found"));

        Report report = new Report();
        report.setReason(req.getReason());
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);

        reportRepository.save(report);

        return toResponse(report);
    }

    // -----------------------------
    // GET ALL REPORTS (ADMIN)
    // -----------------------------
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // -----------------------------
    // DELETE REPORT (ADMIN)
    // -----------------------------
    public void deleteReport(UUID id) {
        if (!reportRepository.existsById(id)) {
            throw new RuntimeException("Report not found");
        }
        reportRepository.deleteById(id);
    }

    // -----------------------------
    // RESOLVE REPORT (ADMIN)
    // -----------------------------
    public void resolveReport(UUID id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setResolved(true);
        reportRepository.save(report);
    }

    // -----------------------------
    // Convert Entity → DTO
    // -----------------------------
    private ReportResponse toResponse(Report r) {
        ReportResponse dto = new ReportResponse();

        dto.setId(r.getId());
        dto.setReason(r.getReason());
        dto.setResolved(r.isResolved());

        dto.setCreatedAt(
                r.getCreatedAt() != null
                        ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null);

        dto.setReporter(toUserDTO(r.getReporter()));
        dto.setReportedUser(toUserDTO(r.getReportedUser()));

        return dto;
    }

    private UserPublicProfileDTO toUserDTO(User u) {
        if (u == null)
            return null;

        UserPublicProfileDTO dto = new UserPublicProfileDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setFirstname(u.getFirstname());
        dto.setLastname(u.getLastname());
        dto.setBio(u.getBio());
        dto.setAvatarUrl(u.getAvatarUrl());

        return dto;
    }
}
