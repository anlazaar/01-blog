package com.blog._1.dto.post;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ChunkUploadRequest {
    @NotNull
    private UUID postId;

    @NotNull
    private Integer index;

    @NotNull
    @Size(max = 10000, message = "Chunk size must not exceed 10000 characters")
    private String content;
}