package com.blog._1.repositories;

import com.blog._1.models.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // OPTIMIZATION: @EntityGraph fixes the N+1 problem.
    // It fetches 'Notification' + 'Post' + 'Post Author' in 1 single query.
    @EntityGraph(attributePaths = { "post", "post.author" })
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId, Pageable pageable);

    long countByReceiverIdAndReadFalse(UUID receiverId);
}