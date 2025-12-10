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

    @PostMapping
    public ResponseEntity<ReportResponse> create(@RequestBody ReportCreateRequest req) {
        return ResponseEntity.ok(reportService.createReport(req));
    }

    // OPTIMIZATION: Added Pagination
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reportService.getAllReports(page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}