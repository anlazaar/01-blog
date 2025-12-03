package com.blog._1.dto.post;

import java.util.UUID;
import java.util.List;

import com.blog._1.dto.comment.CommentResponse;
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
    private String createdAt;
    private String updatedAt;

    private UserPublicProfileDTO author;

    private int likeCount;

    private boolean likedByCurrentUser;

    private List<CommentResponse> comments;

    public static PostResponse from(Post post) {
        PostResponse dto = new PostResponse();

        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setDescription(post.getDescription());
        dto.setMediaUrl(post.getMediaUrl());
        dto.setMediaType(post.getMediaType());

        dto.setCreatedAt(post.getCreatedAt().toString());
        dto.setUpdatedAt(post.getUpdatedAt() != null ? post.getUpdatedAt().toString() : null);

        // author (minimal)
        UserPublicProfileDTO authorDto = new UserPublicProfileDTO();
        authorDto.setId(post.getAuthor().getId());
        authorDto.setUsername(post.getAuthor().getUsername());
        authorDto.setFirstname(post.getAuthor().getFirstname());
        authorDto.setLastname(post.getAuthor().getLastname());
        authorDto.setAvatarUrl(post.getAuthor().getAvatarUrl());
        authorDto.setBio(post.getAuthor().getBio());
        dto.setAuthor(authorDto);

        // like count
        dto.setLikeCount(post.getLikes() != null ? post.getLikes().size() : 0);

        dto.setLikedByCurrentUser(false);

        // comments (minimal)
        if (post.getComments() != null) {
            dto.setComments(
                    post.getComments().stream()
                            .map(comment -> {
                                CommentResponse c = new CommentResponse();
                                c.setId(comment.getId());
                                c.setText(comment.getText());
                                c.setCreatedAt(comment.getCreatedAt());

                                // minimal author info
                                UserPublicProfileDTO commentAuthor = new UserPublicProfileDTO();
                                commentAuthor.setId(comment.getAuthor().getId());
                                commentAuthor.setUsername(comment.getAuthor().getUsername());
                                commentAuthor.setAvatarUrl(comment.getAuthor().getAvatarUrl());
                                c.setAuthor(commentAuthor);

                                return c;
                            })
                            .toList());
        }

        return dto;
    }
}
