package com.blog._1.dto.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor // <--- REQUIRED for Redis Jackson deserialization
@AllArgsConstructor // <--- REQUIRED when using @Builder + @NoArgsConstructor
public class PostChunkResponse {
    private int index;
    private String content;
    private boolean isLast;
}