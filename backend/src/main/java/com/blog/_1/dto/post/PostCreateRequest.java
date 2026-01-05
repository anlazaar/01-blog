package com.blog._1.dto.post;

import java.util.List;

import lombok.Data;

@Data
public class PostCreateRequest {
    private String title;
    private String description;
    private String mediaUrl;
    private String mediaType;

    private List<String> tags;
}
