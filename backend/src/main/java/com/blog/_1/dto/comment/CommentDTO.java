package com.blog._1.dto.comment;

import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.Comment;
import lombok.Data;
import java.util.UUID;

@Data
public class CommentDTO {
    private UUID id;
    private String text;
    private String createdAt;
    private UserPublicProfileDTO author;

    public static CommentDTO from(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setText(comment.getText());
        if (comment.getCreatedAt() != null)
            dto.setCreatedAt(comment.getCreatedAt().toString());

        if (comment.getAuthor() != null) {
            UserPublicProfileDTO u = new UserPublicProfileDTO();
            u.setId(comment.getAuthor().getId());
            u.setUsername(comment.getAuthor().getUsername());
            u.setAvatarUrl(comment.getAuthor().getAvatarUrl());
            dto.setAuthor(u);
        }
        return dto;
    }
}