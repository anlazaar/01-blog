package com.blog._1.services;

import com.blog._1.dto.notification.NotificationResponse;
import com.blog._1.dto.post.PostMinimalDTO;
import com.blog._1.models.Notification;
import com.blog._1.models.Post;
import com.blog._1.models.User;
import com.blog._1.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 min
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        return emitter;
    }

    // OPTIMIZATION: Added @Async and @Transactional
    // This runs in a background thread so the user doesn't wait for notifications
    // to be sent.
    @Async
    @Transactional
    public void notifyFollowers(Post post, List<User> followers) {
        if (followers.isEmpty())
            return;

        log.info("Sending notifications to {} followers for post {}", followers.size(), post.getId());

        List<Notification> notificationsToSave = new ArrayList<>();
        String message = post.getAuthor().getUsername() + " published: " + post.getTitle();

        for (User follower : followers) {
            Notification n = new Notification();
            n.setReceiver(follower);
            n.setPost(post);
            n.setMessage(message);
            n.setRead(false);
            notificationsToSave.add(n);
        }

        // Batch Insert
        List<Notification> savedNotifications = notificationRepository.saveAll(notificationsToSave);

        // Real-time Push (SSE)
        for (Notification n : savedNotifications) {
            UUID receiverId = n.getReceiver().getId();
            if (emitters.containsKey(receiverId)) {
                try {
                    // mapToResponse is safe here because we just created the objects,
                    // so we know the data is loaded.
                    emitters.get(receiverId).send(SseEmitter.event()
                            .name("notification")
                            .data(mapToResponse(n)));
                } catch (IOException e) {
                    emitters.remove(receiverId);
                }
            }
        }
    }

    // OPTIMIZATION: The Repository now eagerly fetches Post+Author,
    // so mapToResponse won't trigger extra queries.
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId, int page, int size) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void markAsRead(UUID notificationId) {
        // Optimization: Use ifPresent to avoid null checks
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public long countUnread(UUID userId) {
        return notificationRepository.countByReceiverIdAndReadFalse(userId);
    }

    private NotificationResponse mapToResponse(Notification n) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setMessage(n.getMessage());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt().toString());

        if (n.getPost() != null) {
            PostMinimalDTO postDto = new PostMinimalDTO();
            postDto.setId(n.getPost().getId());
            postDto.setTitle(n.getPost().getTitle());
            postDto.setAuthorUsername(n.getPost().getAuthor().getUsername());
            dto.setPost(postDto);
        }
        return dto;
    }
}