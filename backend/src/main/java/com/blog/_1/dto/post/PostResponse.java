package com.blog._1.dto.post;

import java.util.UUID;

import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.Post;

import lombok.Data;

@Data
public class PostResponse {
    private UUID id;
    private String title;
    private String description;
    private String mediaUrl;
    private String mediaType;

    // Formatting dates as ISO strings is standard
    private String createdAt;
    private String updatedAt;

    private UserPublicProfileDTO author;

    // OPTIMIZATION: Use long/int for counts, do not send Lists
    private long likeCount;
    private long commentCount;

    // User interaction flags (set by the Service later)
    private boolean savedByCurrentUser;
    private boolean likedByCurrentUser;

    public static PostResponse from(Post post) {
        PostResponse dto = new PostResponse();

        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setDescription(post.getDescription());
        dto.setMediaUrl(post.getMediaUrl());
        dto.setMediaType(post.getMediaType());

        // Safe Date Conversion
        if (post.getCreatedAt() != null) {
            dto.setCreatedAt(post.getCreatedAt().toString());
        }
        if (post.getUpdatedAt() != null) {
            dto.setUpdatedAt(post.getUpdatedAt().toString());
        }

        // OPTIMIZATION: Map Author (Avoids deep nesting issues)
        if (post.getAuthor() != null) {
            UserPublicProfileDTO authorDto = new UserPublicProfileDTO();
            authorDto.setId(post.getAuthor().getId());
            authorDto.setUsername(post.getAuthor().getUsername());
            authorDto.setFirstname(post.getAuthor().getFirstname());
            authorDto.setLastname(post.getAuthor().getLastname());
            authorDto.setAvatarUrl(post.getAuthor().getAvatarUrl());
            // Bio is optional for a small post card, but okay to keep if short
            authorDto.setBio(post.getAuthor().getBio());
            dto.setAuthor(authorDto);
        }

        // OPTIMIZATION: Use the @Formula fields from the Entity
        // Do NOT use post.getLikes().size() -> Causes query
        // Do NOT use post.getComments().size() -> Causes query
        dto.setLikeCount(post.getLikeCount());
        dto.setCommentCount(post.getCommentCount());

        // Defaults
        dto.setLikedByCurrentUser(false);
        dto.setSavedByCurrentUser(false);

        return dto;
    }
}