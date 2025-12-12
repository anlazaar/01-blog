package com.blog._1.services;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blog._1.models.PostLike;
import com.blog._1.repositories.LikeRepository;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository; // Injected to get User reference

    @Transactional
    public void like(UUID postId, UUID userId) {
        // 1. Check if already liked (Fast index scan)
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            return;
        }

        // 2. Optimization: Get Proxy References (No DB Selects occurred here)
        // This links the IDs without fetching the full User/Post objects
        var postRef = postRepository.getReferenceById(postId);
        var userRef = userRepository.getReferenceById(userId);

        PostLike like = new PostLike();
        like.setPost(postRef);
        like.setUser(userRef);

        likeRepository.save(like);
    }

    @Transactional
    public void unlike(UUID postId, UUID userId) {
        // Optimization: Delete directly by ID combination (1 Query)
        // No need to fetch the Like entity first
        likeRepository.deleteByPostIdAndUserId(postId, userId);
    }

    // --- Read Operations ---

    public long countLikes(UUID postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean isLiked(UUID postId, UUID userId) {
        if (userId == null)
            return false;
        return likeRepository.existsByPostIdAndUserId(postId, userId);
    }
}