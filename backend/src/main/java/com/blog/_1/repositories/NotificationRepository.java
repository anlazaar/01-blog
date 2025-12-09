package com.blog._1.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.blog._1.models.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // OPTIMIZATION: Added Pageable.
    // Prevents fetching old history every time user opens the dropdown.
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId, Pageable pageable);

    long countByReceiverIdAndReadFalse(UUID receiverId);
}