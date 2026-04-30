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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @RequestParam(value = "media", required = false) MultipartFile mediaFile,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(
                postService.initPost(title, summary, mediaType, mediaFile, currentUser.getId(), tags));
    }

    @PostMapping("/chunk")
    public ResponseEntity<Void> uploadChunk(
            @RequestBody @Valid ChunkUploadRequest request,
            @AuthenticationPrincipal User currentUser) {
        postService.uploadChunk(request, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(
            @PathVariable UUID id,
            @RequestParam int totalChunks,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.finalizePost(id, currentUser.getId(), totalChunks));
    }

    // --- Static Routes FIRST ---

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getAll(page, size));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PostResponse>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.getSavedPosts(currentUser.getId(), page, size));
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<PostResponse>> getMyDrafts(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.getDrafts(currentUser.getId()));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPosts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) Boolean liked,
            @RequestParam(required = false) Boolean followed,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;

        return ResponseEntity.ok(
                postService.searchPosts(q, author, tags, liked, followed, currentUserId, page, size));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getByUser(userId, page, size));
    }

    @GetMapping("/tag/{tag}")
    public ResponseEntity<Page<PostResponse>> getByTag(
            @PathVariable String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getByTag(tag, page, size));
    }

    // --- Dynamic /{id} Routes AFTER static routes ---

    @GetMapping("/{id}")
    public ResponseEntity<SinglePostResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.get(id));
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<List<PostChunkResponse>> getContentChunks(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(postService.getContentChunks(id, page, size));
    }

    @DeleteMapping("/{id}/content")
    public ResponseEntity<Void> clearContent(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        postService.clearPostContent(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Map<String, Object>> toggleSave(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        boolean isSaved = postService.toggleSave(id, currentUser.getId());
        return ResponseEntity.ok(Map.of("isSaved", isSaved));
    }

    // --- Updates & Deletes ---

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(
            @PathVariable UUID id,
            @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.update(id, currentUser.getId(), request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> patch(
            @PathVariable UUID id,
            @RequestBody PostPatchRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.patch(id, currentUser.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser,
            Authentication auth) {
        boolean isAdmin = auth.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        postService.delete(id, currentUser.getId(), isAdmin);

        return ResponseEntity.ok(Map.of("res", "Post deleted successfully"));
    }
}