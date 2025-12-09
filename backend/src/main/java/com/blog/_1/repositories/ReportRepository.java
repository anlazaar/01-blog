package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.blog._1.models.Report;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    // OPTIMIZATION: Added Pageable for the admin dashboard.
    List<Report> findByResolvedFalse(Pageable pageable);

    long countByResolvedFalse();
}