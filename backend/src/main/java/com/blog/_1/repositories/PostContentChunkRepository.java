package com.blog._1.repositories;

import com.blog._1.models.PostContentChunk;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostContentChunkRepository extends JpaRepository<PostContentChunk, UUID> {
    // Fetch chunks ordered by index
    List<PostContentChunk> findByPostIdOrderByChunkIndexAsc(UUID postId, Pageable pageable);

    long countByPostId(UUID postId);

    void deleteByPostId(UUID postId);
}