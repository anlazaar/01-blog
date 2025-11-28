package com.blog._1.dto.post;

import java.util.UUID;
import java.util.List;

import com.blog._1.dto.comment.CommentResponse;
import com.blog._1.dto.user.UserPublicProfileDTO;

import lombok.Data;

@Data
public class PostResponse {
    private UUID id;
    private String description;
    private String mediaUrl;
    private String mediaType;
    private String createdAt;
    private String updatedAt;

    private UserPublicProfileDTO author;

    private int likeCount;

    private List<CommentResponse> comments;
}
