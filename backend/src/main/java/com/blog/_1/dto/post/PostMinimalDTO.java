package com.blog._1.dto.post;

import java.time.LocalDateTime;
import java.util.UUID;

import com.blog._1.models.PostStatus;

import lombok.Data;

@Data
public class PostMinimalDTO {
    private UUID id;
    private String title;
    private LocalDateTime createdAt;
    private String mediaUrl;
    private String authorUsername;
    private String mediaType;
    private PostStatus postStatus;
}
