package com.blog._1.repositories;

import com.blog._1.models.Hashtag;
import com.blog._1.models.PostStatus;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HashtagRepository extends JpaRepository<Hashtag, UUID> {
    Optional<Hashtag> findByName(String name);

    // --- NEW: Find Top Used Tags ---
    // We join Post -> Hashtags, filter by PUBLISHED status, group by Tag, and order
    // by count
    @Query("SELECT h.name " +
            "FROM Post p " +
            "JOIN p.hashtags h " +
            "WHERE p.status = :status " +
            "GROUP BY h.id, h.name " +
            "ORDER BY COUNT(p) DESC")
    List<String> findTopHashtags(PostStatus status, Pageable pageable);

    @Query("SELECT h.name FROM Hashtag h WHERE h.name LIKE LOWER(CONCAT(:query, '%'))")
    List<String> searchByName(String query, Pageable pageable);
}