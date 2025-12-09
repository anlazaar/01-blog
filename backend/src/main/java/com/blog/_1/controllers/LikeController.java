package com.blog._1.controllers;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.blog._1.services.LikeService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{postId}/like")
    public ResponseEntity<Map<String, String>> like(@PathVariable UUID postId) {
        likeService.like(postId);
        return ResponseEntity.ok(Map.of("message", "Post liked"));
    }

    @PostMapping("/{postId}/unlike")
    public ResponseEntity<Map<String, String>> unlike(@PathVariable UUID postId) {
        likeService.unlike(postId);
        return ResponseEntity.ok(Map.of("message", "Post unliked"));
    }
}