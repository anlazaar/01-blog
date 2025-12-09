package com.blog._1.controllers;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.blog._1.services.SubscriptionService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/{id}/follow")
    public ResponseEntity<Map<String, String>> follow(@PathVariable UUID id) {
        subscriptionService.subscribe(id);
        return ResponseEntity.ok(Map.of("Res", "Followed successfully"));
    }

    @PostMapping("/{id}/unfollow")
    public ResponseEntity<Map<String, String>> unfollow(@PathVariable UUID id) {
        subscriptionService.unsubscribe(id);
        return ResponseEntity.ok(Map.of("Res", "Unfollowed successfully"));
    }
}