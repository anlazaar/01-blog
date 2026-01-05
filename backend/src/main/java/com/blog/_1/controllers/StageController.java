package com.blog._1.controllers;

import com.blog._1.dto.stage.StageRequestDto;
import com.blog._1.models.Stage;
import com.blog._1.models.User;
import com.blog._1.services.StageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    @PostMapping
    public ResponseEntity<Stage> createStage(@RequestBody StageRequestDto dto,
            @AuthenticationPrincipal User user) {
        // Note: Assuming your User implements UserDetails or you handle mapping
        return ResponseEntity.ok(stageService.createStage(dto, user.getId()));
    }

    @PostMapping("/{stageId}/join")
    public ResponseEntity<?> joinStage(@PathVariable UUID stageId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(stageService.joinStage(stageId, user.getId()));
    }
}