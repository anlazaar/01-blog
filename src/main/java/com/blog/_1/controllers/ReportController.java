package com.blog._1.controllers;

import com.blog._1.dto.report.ReportCreateRequest;
import com.blog._1.dto.report.ReportResponse;
import com.blog._1.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // USER — Create report
    @PostMapping
    public ResponseEntity<ReportResponse> create(@RequestBody ReportCreateRequest req) {
        return ResponseEntity.ok(reportService.createReport(req));
    }

    // ADMIN — Get all reports
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAll() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    // ADMIN — Delete report
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
