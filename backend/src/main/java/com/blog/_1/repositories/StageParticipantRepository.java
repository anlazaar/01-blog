package com.blog._1.repositories;

import com.blog._1.models.StageParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface StageParticipantRepository extends JpaRepository<StageParticipant, UUID> {
    Optional<StageParticipant> findByStageIdAndUserId(UUID stageId, UUID userId);

    void deleteByStageIdAndUserId(UUID stageId, UUID userId);
}