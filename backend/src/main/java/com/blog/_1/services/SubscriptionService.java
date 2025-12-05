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

    // FOLLOW a user
    public void subscribe(UUID targetUserId) {

        User follower = getCurrentUser();
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (follower.getId().equals(targetUserId))
            throw new RuntimeException("You cannot follow yourself");

        boolean alreadyFollowing = subscriptionRepository
                .findByFollower_IdAndFollowing_Id(follower.getId(), targetUserId)
                .isPresent();

        if (alreadyFollowing)
            return; // prevent double follow

        Subscription sub = new Subscription();
        sub.setFollower(follower);
        sub.setFollowing(following);

        subscriptionRepository.save(sub);
    }

    // UNFOLLOW a user
    public void unsubscribe(UUID targetUserId) {
        User follower = getCurrentUser();

        subscriptionRepository.findByFollower_IdAndFollowing_Id(follower.getId(), targetUserId)
                .ifPresent(subscriptionRepository::delete);
    }

    public int countFollowers(UUID userId) {
        return subscriptionRepository.findByFollowing_Id(userId).size();
    }

    public int countFollowing(UUID userId) {
        return subscriptionRepository.findByFollower_Id(userId).size();
    }

    public boolean isFollowing(UUID currentUserId, UUID profileUserId) {
        return subscriptionRepository
                .findByFollower_IdAndFollowing_Id(currentUserId, profileUserId)
                .isPresent();
    }
}
