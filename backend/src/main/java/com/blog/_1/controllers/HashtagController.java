package com.blog._1.controllers;

import com.blog._1.services.HashtagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
public class HashtagController {

    private final HashtagService hashtagService;

    @GetMapping("/popular")
    public ResponseEntity<List<String>> getPopularTags(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(hashtagService.getPopularTags(limit));
    }

    @GetMapping("/search")
    public ResponseEntity<List<String>> searchTags(@RequestParam String query) {
        return ResponseEntity.ok(hashtagService.searchTags(query));
    }
}