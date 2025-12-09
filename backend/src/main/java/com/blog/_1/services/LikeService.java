package com.blog._1.services;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blog._1.models.PostLike;
import com.blog._1.models.User;
import com.blog._1.repositories.LikeRepository;
import com.blog._1.repositories.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public void like(UUID postId) {
        User user = getCurrentUser();

        // OPTIMIZATION: Don't fetch the whole object if we just want to check existence
        if (likeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            return;
        }

        // OPTIMIZATION: Use getReference to avoid SELECT on Post table
        var post = postRepository.getReferenceById(postId);

        PostLike like = new PostLike();
        like.setPost(post);
        like.setUser(user);

        likeRepository.save(like);
    }

    public void unlike(UUID postId) {
        User user = getCurrentUser();
        // Standard JPA delete is fine here
        likeRepository.findByPostIdAndUserId(postId, user.getId())
                .ifPresent(likeRepository::delete);
    }

    public long countLikes(UUID postId) {
        // OPTIMIZATION: Count query
        return likeRepository.countByPostId(postId);
    }

    public boolean isLikedByCurrentUser(UUID postId) {
        try {
            User user = getCurrentUser();
            return likeRepository.existsByPostIdAndUserId(postId, user.getId());
        } catch (Exception e) {
            return false; // For anonymous users
        }
    }
}