package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    // Get notifications for a specific user, ordered by newest first
    List<Notification> findByReceiver_IdOrderByCreatedAtDesc(UUID receiverId);

    // Count unread notifications
    long countByReceiver_IdAndReadFalse(UUID receiverId);
}