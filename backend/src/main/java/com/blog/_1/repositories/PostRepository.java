package com.blog._1.repositories;

import com.blog._1.models.Post;
import com.blog._1.models.PostStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    // OPTIMIZATION: Removed 'findByAuthor'. Use ID instead.
    // OPTIMIZATION: Added Pageable (Infinite scroll support).
    @EntityGraph(attributePaths = { "author" })
    Page<Post> findByAuthorId(UUID authorId, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    @EntityGraph(attributePaths = { "author" })
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    List<Post> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    @EntityGraph(attributePaths = { "author" })
    List<Post> findByAuthorIdAndStatus(UUID authorId, PostStatus status, Pageable pageable);

    @Query("SELECT p.createdAt FROM Post p WHERE p.createdAt > :date")
    List<LocalDateTime> findAllCreatedDatesAfter(LocalDateTime date);
}