package com.blog._1.repositories;

import com.blog._1.models.SavedPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {

    // Efficient check
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    // OPTIMIZATION: Direct DB delete without fetching the entity first.
    @Modifying
    @Transactional
    @Query("DELETE FROM SavedPost s WHERE s.user.id = :userId AND s.post.id = :postId")
    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    // OPTIMIZATION: Added Pageable. User might have saved hundreds of posts.
    List<SavedPost> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT s.post.id FROM SavedPost s WHERE s.user.id = :userId AND s.post.id IN :postIds")
    Set<UUID> findPostIdsByUserIdAndPostIdIn(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

}