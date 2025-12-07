package com.blog._1.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.blog._1.models.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    List<User> findAllByCreatedAtAfter(LocalDateTime date);

    @Query(value = """
            SELECT * FROM users u
            WHERE u.id != :userId
            AND u.id NOT IN (
                SELECT s.following_id FROM subscriptions s WHERE s.follower_id = :userId
            )
            ORDER BY RANDOM()
            LIMIT 3
            """, nativeQuery = true)
    List<User> findSuggestedUsers(@Param("userId") UUID userId);
}
