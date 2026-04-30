package com.blog._1.services;

import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
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
    private final UserRepository userRepository;

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "single_post", key = "#postId"),
            @CacheEvict(value = "post_pages", allEntries = true) // Wipes the paginated lists so the likeCount updates
    })
    public void like(UUID postId, UUID userId) {
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            return;
        }

        var postRef = postRepository.getReferenceById(postId);
        var userRef = userRepository.getReferenceById(userId);

        PostLike like = new PostLike();
        like.setPost(postRef);
        like.setUser(userRef);

        likeRepository.save(like);
        postRepository.incrementLikeCount(postId);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "single_post", key = "#postId"),
            @CacheEvict(value = "post_pages", allEntries = true)
    })

    public void unlike(UUID postId, UUID userId) {
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            likeRepository.deleteByPostIdAndUserId(postId, userId);
            postRepository.decrementLikeCount(postId);
        }
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