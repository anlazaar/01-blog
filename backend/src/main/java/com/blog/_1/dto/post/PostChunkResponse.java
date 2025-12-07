package com.blog._1.dto.post;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostChunkResponse {
    private int index;
    private String content;
    private boolean isLast;
}