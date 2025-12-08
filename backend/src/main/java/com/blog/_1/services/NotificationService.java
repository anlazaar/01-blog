package com.blog._1.services;

import com.blog._1.dto.notification.NotificationResponse;
import com.blog._1.dto.post.PostMinimalDTO;
import com.blog._1.models.Notification;
import com.blog._1.models.Post;
import com.blog._1.models.User;
import com.blog._1.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Thread-safe map to store active user connections
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    // 1. Subscribe method (SSE Connection)
    public SseEmitter subscribe(UUID userId) {
        // Timeout set to 30 mins (adjust as needed)
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        return emitter;
    }

    // 2. Trigger Notification (Called when a post is published)
    public void notifyFollowers(Post post, List<User> followers) {
        System.out.println("Processing notifications for post: " + post.getId()); // LOG

        for (User follower : followers) {
            // Save to Database
            Notification notification = new Notification();
            notification.setReceiver(follower);
            notification.setPost(post);
            notification.setMessage(post.getAuthor().getUsername() + " published: " + post.getTitle());
            notification.setRead(false);

            Notification saved = notificationRepository.save(notification);

            // Push to User
            if (emitters.containsKey(follower.getId())) {
                System.out.println("Pushing to user: " + follower.getUsername()); // LOG: FOUND
                try {
                    SseEmitter emitter = emitters.get(follower.getId());
                    emitter.send(SseEmitter.event()
                            .name("notification")
                            .data(mapToResponse(saved)));
                } catch (IOException e) {
                    System.out.println("Emitter failed for user, removing."); // LOG: FAILED
                    emitters.remove(follower.getId());
                }
            } else {
                System.out.println("User " + follower.getUsername() + " is NOT connected to SSE."); // LOG: NOT
                                                                                                    // CONNECTED
            }
        }
    }

    // 3. Get All Notifications (History)
    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByReceiver_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 4. Mark as Read
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    // Helper: Map Entity to DTO
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