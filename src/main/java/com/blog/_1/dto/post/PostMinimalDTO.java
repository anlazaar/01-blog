package com.blog._1.dto.post;

import java.util.UUID;

import lombok.Data;

@Data
public class PostMinimalDTO {
    private UUID id;
    private String description;
    private String mediaUrl;
    private String mediaType;
}
