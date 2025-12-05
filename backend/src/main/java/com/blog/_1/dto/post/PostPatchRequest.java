package com.blog._1.dto.post;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostPatchRequest {
    private String title;
    private String description;
}
