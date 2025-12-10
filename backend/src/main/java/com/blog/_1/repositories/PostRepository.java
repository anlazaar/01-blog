package com.blog._1.repositories;

import com.blog._1.models.Post;
import com.blog._1.models.PostStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    List<Post> findByAuthorId(UUID authorId, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.status = :status")
    Page<Post> findByStatus(@Param("status") PostStatus status, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    List<Post> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    // OPTIMIZATION: Added Pageable.
    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.author.id = :authorId AND p.status = :status ORDER BY p.updatedAt DESC")
    List<Post> findByAuthorIdAndStatusOrderByUpdatedAtDesc(@Param("authorId") UUID authorId,
            @Param("status") PostStatus status, Pageable pageable);
}