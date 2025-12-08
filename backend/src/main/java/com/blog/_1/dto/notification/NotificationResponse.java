package com.blog._1.dto.notification;

import java.util.UUID;

import com.blog._1.dto.post.PostMinimalDTO;

import lombok.Data;

@Data
public class NotificationResponse {
    private UUID id;
    private String message;
    private boolean read;
    private String createdAt;

    private PostMinimalDTO post;
}
