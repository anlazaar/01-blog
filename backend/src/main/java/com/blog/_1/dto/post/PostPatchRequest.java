package com.blog._1.dto.post;

import com.blog._1.models.PostStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostPatchRequest {
    private String title;
    private String description;
    private PostStatus postStatus;
}
