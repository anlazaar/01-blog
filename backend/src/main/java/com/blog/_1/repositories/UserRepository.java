package com.blog._1.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    // Standard lookups
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    // Existence checks are efficient, keep them.
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // OPTIMIZATION: Added Pageable. Returning ALL users after a date could result
    // in thousands of rows.
    List<User> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    // OPTIMIZATION:
    // 1. Used explicit nativeQuery for performance.
    // 2. Note: ORDER BY RANDOM() is slow on large tables.
    // For better performance in the future, fetch a batch of IDs and shuffle in
    // Java.
    @Query(value = """
            SELECT * FROM users u
            WHERE u.id != :userId
            AND u.id NOT IN (
                SELECT s.following_id FROM subscriptions s WHERE s.follower_id = :userId
            )
            ORDER BY RANDOM()
            LIMIT :limit
            """, nativeQuery = true)
    List<User> findSuggestedUsers(@Param("userId") UUID userId, @Param("limit") int limit);

    @Query("""
                SELECT new com.blog._1.dto.user.UserPublicProfileDTO(
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.bio,
                    u.avatarUrl,
                    (SELECT COUNT(s1) FROM Subscription s1 WHERE s1.following.id = u.id),
                    (SELECT COUNT(s2) FROM Subscription s2 WHERE s2.follower.id = u.id)
                )
                FROM User u
            """)
    Page<UserPublicProfileDTO> findAllUserSummaries(Pageable pageable);
}