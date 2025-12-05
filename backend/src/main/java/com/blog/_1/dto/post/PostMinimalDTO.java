package com.blog._1.dto.post;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class PostMinimalDTO {
    private UUID id;
    private String title;
    private LocalDateTime createdAt;
    private String mediaUrl;
    private String authorUsername;
    private String mediaType;
}
