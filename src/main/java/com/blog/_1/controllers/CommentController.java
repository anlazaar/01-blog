package com.blog._1.controllers;

import com.blog._1.dto.comment.CommentCreateRequest;
import com.blog._1.dto.comment.CommentResponse;
import com.blog._1.models.User;
import com.blog._1.services.CommentService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // CREATE COMMENT
    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID postId,
            @RequestBody CommentCreateRequest request) {

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(
                commentService.create(postId, currentUser.getId(), request));
    }

    // DELETE COMMENT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        commentService.delete(id, userId, isAdmin);
        return ResponseEntity.ok("Comment deleted");
    }
}
