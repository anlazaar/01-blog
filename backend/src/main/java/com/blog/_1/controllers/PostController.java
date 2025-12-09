package com.blog._1.controllers;

import com.blog._1.dto.post.*;
import com.blog._1.models.User;
import com.blog._1.services.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
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

    // --- Standalone Media Upload ---
    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadEditorMedia(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(Map.of("url", postService.uploadPostMedia(file)));
    }

    // --- Post Lifecycle ---
    @PostMapping(value = "/init", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> initPost(
            @RequestParam("title") String title,
            @RequestParam("description") String summary,
            @RequestParam(value = "mediaType", required = false) String mediaType,
            @RequestParam(value = "media", required = false) MultipartFile mediaFile) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.initPost(title, summary, mediaType, mediaFile, currentUser.getId()));
    }

    @PostMapping("/chunk")
    public ResponseEntity<Void> uploadChunk(@RequestBody @Valid ChunkUploadRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        postService.uploadChunk(request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(@PathVariable UUID id, @RequestParam int totalChunks) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.finalizePost(id, currentUser.getId(), totalChunks));
    }

    // --- Fetching (Optimized with Pagination) ---

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getAll(page, size));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getByUser(userId, page, size));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PostResponse>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.getSavedPosts(currentUser.getId(), page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SinglePostResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.get(id));
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<PostResponse>> getMyDrafts() {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.getDrafts(currentUser.getId()));
    }

    // --- Content & Actions ---

    @GetMapping("/{id}/content")
    public ResponseEntity<List<PostChunkResponse>> getContentChunks(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(postService.getContentChunks(id, page, size));
    }

    @DeleteMapping("/{id}/content")
    public ResponseEntity<Void> clearContent(@PathVariable UUID id) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        postService.clearPostContent(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Map<String, Object>> toggleSave(@PathVariable UUID id) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isSaved = postService.toggleSave(id, currentUser.getId());
        return ResponseEntity.ok(Map.of("isSaved", isSaved));
    }

    // --- Updates & Deletes ---

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(
            @PathVariable UUID id, @RequestBody PostCreateRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.update(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> patch(@PathVariable UUID id, @RequestBody PostPatchRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(postService.patch(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id, Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        postService.delete(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("res", "Post deleted successfully"));
    }
}