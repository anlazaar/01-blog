package com.blog._1.repositories;

import com.blog._1.models.Post;
import com.blog._1.models.PostStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID>, JpaSpecificationExecutor<Post> {

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

    @EntityGraph(attributePaths = { "author" })
    Page<Post> findByHashtags_NameAndStatus(String name, PostStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(UUID postId);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = CASE WHEN p.likeCount > 0 THEN p.likeCount - 1 ELSE 0 END WHERE p.id = :postId")
    void decrementLikeCount(UUID postId);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :postId")
    void incrementCommentCount(UUID postId);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = CASE WHEN p.commentCount > 0 THEN p.commentCount - 1 ELSE 0 END WHERE p.id = :postId")
    void decrementCommentCount(UUID postId);
}