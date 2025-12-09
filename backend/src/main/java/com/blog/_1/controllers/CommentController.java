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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable UUID postId,
            @RequestBody CommentCreateRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(commentService.create(postId, currentUser.getId(), request));
    }

    // OPTIMIZATION: Added Pagination for comments
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(commentService.getComments(postId, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(@PathVariable UUID id, Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        commentService.delete(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok("Comment deleted");
    }
}