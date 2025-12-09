package com.blog._1.repositories;

import com.blog._1.models.PostContentChunk;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostContentChunkRepository extends JpaRepository<PostContentChunk, UUID> {

    // This was already good (using Pageable).
    List<PostContentChunk> findByPostIdOrderByChunkIndexAsc(UUID postId, Pageable pageable);

    long countByPostId(UUID postId);

    // OPTIMIZATION: Bulk delete.
    @Modifying
    @Transactional
    @Query("DELETE FROM PostContentChunk p WHERE p.post.id = :postId")
    void deleteByPostId(UUID postId);
}