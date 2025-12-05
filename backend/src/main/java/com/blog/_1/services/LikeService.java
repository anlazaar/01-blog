package com.blog._1.services;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blog._1.models.Post;
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

    // LIKE a post
    public void like(UUID postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean alreadyLiked = likeRepository
                .findByPost_IdAndUser_Id(postId, user.getId())
                .isPresent();

        if (alreadyLiked)
            return;

        PostLike like = new PostLike();
        like.setPost(post);
        like.setUser(user);

        likeRepository.save(like);
    }

    // UNLIKE a post
    public void unlike(UUID postId) {
        User user = getCurrentUser();

        likeRepository.findByPost_IdAndUser_Id(postId, user.getId())
                .ifPresent(likeRepository::delete);
    }

    public long countLikes(UUID postId) {
        return likeRepository.countByPost_Id(postId);
    }

    public boolean isLikedByCurrentUser(UUID postId) {
        User user = getCurrentUser();
        return likeRepository.findByPost_IdAndUser_Id(postId, user.getId()).isPresent();
    }
}
