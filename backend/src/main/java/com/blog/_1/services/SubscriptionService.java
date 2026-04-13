package com.blog._1.services;

import java.util.UUID;

import org.springframework.cache.CacheManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // Inject CacheManager to handle eviction programmatically
    private final CacheManager cacheManager;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @Transactional
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

        // EVICT CACHES to update follower/following counts
        evictSubscriptionCaches(follower.getId(), targetUserId);
    }

    @Transactional
    public void unsubscribe(UUID targetUserId) {
        User follower = getCurrentUser();

        subscriptionRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId)
                .ifPresent(sub -> {
                    subscriptionRepository.delete(sub);
                    // EVICT CACHES to update follower/following counts
                    evictSubscriptionCaches(follower.getId(), targetUserId);
                });
    }

    // --- Helper Method for Cache Eviction ---
    private void evictSubscriptionCaches(UUID followerId, UUID followingId) {
        var singleUserCache = cacheManager.getCache("single_user");
        if (singleUserCache != null) {
            singleUserCache.evict(followerId); // Updates followingCount
            singleUserCache.evict(followingId); // Updates followersCount
        }

        var pagesCache = cacheManager.getCache("user_pages");
        if (pagesCache != null) {
            pagesCache.clear(); // Wipes lists so counts are accurate everywhere
        }
    }

    // --- Read Operations ---

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