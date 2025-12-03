package com.blog._1.dto.comment;

import com.blog._1.dto.user.UserPublicProfileDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CommentResponse {

    private UUID id;
    private String text;
    private LocalDateTime createdAt; // as String, to match PostResponse
    private UserPublicProfileDTO author; // minimal author info

}
