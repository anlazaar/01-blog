package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByPost_Id(UUID postId);
}