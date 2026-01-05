package com.blog._1.services;

import com.blog._1.dto.stage.StageRequestDto;
import com.blog._1.models.*;
import com.blog._1.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import org.apache.commons.lang3.RandomStringUtils; // Or use a simple random string generator

@Service
@RequiredArgsConstructor
public class StageService {

    private final StageRepository stageRepository;
    private final StageParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @Transactional
    public Stage createStage(StageRequestDto dto, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stage stage = Stage.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .isPrivate(dto.isPrivate())
                .owner(owner)
                .isActive(true)
                .inviteCode(RandomStringUtils.randomAlphanumeric(6).toUpperCase()) // Requires commons-lang3 or custom
                                                                                   // method
                .build();

        stage = stageRepository.save(stage);

        // Add owner as a participant automatically
        StageParticipant participant = StageParticipant.builder()
                .stage(stage)
                .user(owner)
                .role(StageRole.OWNER)
                .status(ConnectionStatus.JOINED)
                .isMuted(false)
                .build();

        participantRepository.save(participant);
        return stage;
    }

    @Transactional
    public StageParticipant joinStage(UUID stageId, UUID userId) {
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if already joined
        if (participantRepository.findByStageIdAndUserId(stageId, userId).isPresent()) {
            throw new RuntimeException("User already in stage");
        }

        StageParticipant participant = StageParticipant.builder()
                .stage(stage)
                .user(user)
                .role(StageRole.LISTENER) // Default to listener
                .status(ConnectionStatus.JOINED)
                .isMuted(true)
                .build();

        return participantRepository.save(participant);
    }

    // Logic for requests to speak, etc. goes here
}