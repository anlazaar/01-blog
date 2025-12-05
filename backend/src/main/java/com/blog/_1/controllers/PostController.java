package com.blog._1.controllers;

import com.blog._1.dto.post.PostCreateRequest;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.models.User;
import com.blog._1.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // Create post
    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<PostResponse> create(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "mediaType", required = false) String mediaType,
            @RequestParam(value = "media", required = false) MultipartFile mediaFile) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.create(title, description, mediaType, mediaFile, currentUser.getId()));
    }

    // Get post by ID (public)
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.get(id));
    }

    // Get all posts (public)
    @GetMapping
    public ResponseEntity<List<PostResponse>> getAll() {
        return ResponseEntity.ok(postService.getAll());
    }

    // Update post
    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(
            @PathVariable UUID id,
            @RequestBody PostCreateRequest request,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(postService.update(id, userId, request));
    }

    // Delete post (author or admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable UUID id,
            Authentication auth) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        postService.delete(id, currentUser.getId(), isAdmin);

        return ResponseEntity.ok().body(Map.of("res", "Post deleted successfully"));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> patch(
            @PathVariable UUID id,
            @RequestBody PostPatchRequest request,
            Authentication auth) {

        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(postService.patch(id, userId, request));
    }

    // Get posts by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(postService.getByUser(userId));
    }
}
