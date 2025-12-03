package com.blog._1.repositories;

import java.util.Optional;
import java.util.UUID;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByFollower_IdAndFollowing_Id(UUID followerId, UUID followingId);

    List<Subscription> findByFollower_Id(UUID followerId);

    List<Subscription> findByFollowing_Id(UUID followingId);
}