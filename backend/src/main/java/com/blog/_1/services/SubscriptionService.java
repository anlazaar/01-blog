package com.blog._1.services;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blog._1.models.Subscription;
import com.blog._1.models.User;
import com.blog._1.repositories.SubscriptionRepository;
import com.blog._1.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public void subscribe(UUID targetUserId) {
        User follower = getCurrentUser();
        if (follower.getId().equals(targetUserId))
            throw new RuntimeException("You cannot follow yourself");

        // Simple check
        if (subscriptionRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId).isPresent()) {
            return;
        }

        // Optimization: Use Reference to avoid full User fetch
        User following = userRepository.getReferenceById(targetUserId);

        Subscription sub = new Subscription();
        sub.setFollower(follower);
        sub.setFollowing(following);

        subscriptionRepository.save(sub);
    }

    public void unsubscribe(UUID targetUserId) {
        User follower = getCurrentUser();
        subscriptionRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId)
                .ifPresent(subscriptionRepository::delete);
    }

    // OPTIMIZATION: Database count is instant. List size is slow.
    public long countFollowers(UUID userId) {
        return subscriptionRepository.countByFollowingId(userId);
    }

    public long countFollowing(UUID userId) {
        return subscriptionRepository.countByFollowerId(userId);
    }

    public boolean isFollowing(UUID currentUserId, UUID profileUserId) {
        if (currentUserId == null)
            return false;
        return subscriptionRepository
                .findByFollowerIdAndFollowingId(currentUserId, profileUserId)
                .isPresent();
    }
}