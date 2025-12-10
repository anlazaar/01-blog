package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // OPTIMIZATION: Added Pageable to support "Load More Comments".
    // Also supports ordering (e.g., sort by createdAt desc in the Pageable object).
    List<Comment> findByPostId(UUID postId, Pageable pageable);

    // Useful addition for UI
    long countByPostId(UUID postId);
}