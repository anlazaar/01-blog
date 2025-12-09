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
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

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

    public void notifyFollowers(Post post, List<User> followers) {
        if (followers.isEmpty())
            return;

        List<Notification> notificationsToSave = new ArrayList<>();
        String message = post.getAuthor().getUsername() + " published: " + post.getTitle();

        // 1. Prepare Data
        for (User follower : followers) {
            Notification n = new Notification();
            n.setReceiver(follower);
            n.setPost(post);
            n.setMessage(message);
            n.setRead(false);
            notificationsToSave.add(n);
        }

        // 2. OPTIMIZATION: Batch Insert (One Transaction)
        List<Notification> savedNotifications = notificationRepository.saveAll(notificationsToSave);

        // 3. Real-time Push
        for (Notification n : savedNotifications) {
            UUID receiverId = n.getReceiver().getId();
            if (emitters.containsKey(receiverId)) {
                try {
                    emitters.get(receiverId).send(SseEmitter.event()
                            .name("notification")
                            .data(mapToResponse(n)));
                } catch (IOException e) {
                    emitters.remove(receiverId);
                }
            }
        }
    }

    // OPTIMIZATION: Added Pagination (page 0, 20 items)
    public List<NotificationResponse> getUserNotifications(UUID userId, int page, int size) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void markAsRead(UUID notificationId) {
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