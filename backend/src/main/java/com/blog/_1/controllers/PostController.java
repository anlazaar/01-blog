package com.blog._1.controllers;

import com.blog._1.dto.post.ChunkUploadRequest;
import com.blog._1.dto.post.PostChunkResponse;
import com.blog._1.dto.post.PostCreateRequest;
import com.blog._1.dto.post.PostPatchRequest;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.models.User;
import com.blog._1.services.PostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
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

    // --- NEW ENDPOINT: Standalone Media Upload for Editor ---
    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadEditorMedia(
            @RequestParam("file") MultipartFile file) {

        // No User check needed if purely public, but usually you want them logged in:
        // Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String fileUrl = postService.uploadPostMedia(file);

        // Return JSON: { "url": "/uploads/xyz.jpg" }
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    // 1. Init Post (Metadata only)
    @PostMapping(value = "/init", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> initPost(
            @RequestParam("title") String title,
            @RequestParam("description") String summary,
            @RequestParam(value = "mediaType", required = false) String mediaType,
            @RequestParam(value = "media", required = false) MultipartFile mediaFile) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.initPost(title, summary, mediaType, mediaFile, currentUser.getId()));
    }

    // 2. Upload Chunk (JSON body now)
    @PostMapping("/chunk")
    public ResponseEntity<?> uploadChunk(@RequestBody @Valid ChunkUploadRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        postService.uploadChunk(request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    // 3. Finalize
    @PostMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(
            @PathVariable UUID id,
            @RequestParam int totalChunks) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.finalizePost(id, currentUser.getId(), totalChunks));
    }

    // Get post by ID (public)
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.get(id));
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<List<PostChunkResponse>> getContentChunks(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(postService.getContentChunks(id, page, size));
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