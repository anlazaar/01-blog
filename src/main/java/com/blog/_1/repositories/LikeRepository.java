package com.blog._1.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.PostLike;

public interface LikeRepository extends JpaRepository<PostLike, UUID> {
    Optional<PostLike> findByPost_IdAndUser_Id(UUID postId, UUID userId);

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    long countByPost_Id(UUID postId);
}