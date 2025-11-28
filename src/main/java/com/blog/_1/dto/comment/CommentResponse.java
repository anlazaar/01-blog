package com.blog._1.dto.comment;

import java.util.UUID;

import com.blog._1.dto.user.UserPublicProfileDTO;

import lombok.Data;

@Data
public class CommentResponse {
    private UUID id;
    private String text;
    private String createdAt;
    private UserPublicProfileDTO author;
}
