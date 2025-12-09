package com.blog._1.repositories;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.blog._1.models.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    @Query("SELECT s.following.id FROM Subscription s WHERE s.follower.id = :followerId")
    Set<UUID> findFollowingIdsByFollowerId(@Param("followerId") UUID followerId);

    // OPTIMIZATION: Added Pageable to prevent loading massive lists.
    // Also simplified naming (JPA handles 'Id' suffix automatically).
    List<Subscription> findByFollowerId(UUID followerId, Pageable pageable);

    List<Subscription> findByFollowingId(UUID followingId, Pageable pageable);

    // useful for counters (much faster than fetching the list to count size)
    long countByFollowerId(UUID followerId);

    long countByFollowingId(UUID followingId);

    @Query("SELECT s.following.id FROM Subscription s WHERE s.follower.id = :followerId AND s.following.id IN :targetIds")
    Set<UUID> findFollowingIdsByFollowerIdAndFollowingIdIn(
            @Param("followerId") UUID followerId,
            @Param("targetIds") List<UUID> targetIds);
}