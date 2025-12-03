package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByReceiver_IdOrderByCreatedAtDesc(UUID userId);
}