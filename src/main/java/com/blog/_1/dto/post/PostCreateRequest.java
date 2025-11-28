package com.blog._1.dto.post;

import lombok.Data;

@Data
public class PostCreateRequest {
    private String description;
    private String mediaUrl;
    private String mediaType;
}
