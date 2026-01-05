package com.blog._1.repositories;

import com.blog._1.models.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface StageRepository extends JpaRepository<Stage, UUID> {
    Optional<Stage> findByInviteCode(String inviteCode);

    List<Stage> findByIsActiveTrue();
}