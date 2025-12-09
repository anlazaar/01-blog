package com.blog._1.services;

import com.blog._1.dto.post.*;
import com.blog._1.models.*;
import com.blog._1.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostContentChunkRepository chunkRepository;
    private final NotificationService notificationService;
    private final SubscriptionRepository subscriptionRepository;
    private final SavedPostRepository savedPostRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // --- UTILS ---
    private String saveFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath))
                Files.createDirectories(uploadPath);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file");
        }
    }

    public String uploadPostMedia(MultipartFile file) {
        if (file.isEmpty())
            throw new RuntimeException("File is empty");
        if (file.getSize() > 20 * 1024 * 1024)
            throw new RuntimeException("File too large > 20MB");
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new RuntimeException("Invalid file type");
        }
        return saveFile(file);
    }

    // --- POST LOGIC ---

    // Restored: PATCH method
    public PostResponse patch(UUID postId, UUID userId, PostPatchRequest req) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to edit this post");
        }

        if (req.getTitle() != null) {
            post.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            post.setDescription(req.getDescription());
        }

        Post updated = postRepository.save(post);
        return PostResponse.from(updated);
    }

    @Transactional
    public PostResponse initPost(String title, String summary, String mediaType, MultipartFile mediaFile,
            UUID authorId) {
        User author = userRepository.getReferenceById(authorId);
        Post post = new Post();
        post.setTitle(title);
        post.setDescription(summary);
        post.setAuthor(author);
        post.setStatus(PostStatus.DRAFT);
        if (mediaFile != null && !mediaFile.isEmpty()) {
            post.setMediaUrl(saveFile(mediaFile));
            post.setMediaType(mediaType);
        }
        return PostResponse.from(postRepository.save(post));
    }

    @Transactional
    public void uploadChunk(ChunkUploadRequest request, UUID userId) {
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId))
            throw new RuntimeException("Unauthorized");

        PostContentChunk chunk = PostContentChunk.builder()
                .post(post)
                .chunkIndex(request.getIndex())
                .content(request.getContent())
                .build();
        chunkRepository.save(chunk);
    }

    @Transactional
    public PostResponse finalizePost(UUID postId, UUID userId, int expectedTotalChunks) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(userId))
            throw new RuntimeException("Unauthorized");

        long actualCount = chunkRepository.countByPostId(postId);
        if (actualCount != expectedTotalChunks)
            throw new RuntimeException("Upload incomplete");

        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        Pageable pageable = PageRequest.of(0, 500);
        List<User> followers = subscriptionRepository.findByFollowingId(userId, pageable)
                .stream().map(Subscription::getFollower).collect(Collectors.toList());

        if (!followers.isEmpty()) {
            notificationService.notifyFollowers(savedPost, followers);
        }

        return PostResponse.from(savedPost);
    }

    // --- GETTERS ---

    public List<PostResponse> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<PostResponse> posts = postRepository.findByStatus(PostStatus.PUBLISHED, pageable)
                .stream().map(PostResponse::from).collect(Collectors.toList());
        enrichWithUserInteraction(posts);
        return posts;
    }

    public List<PostResponse> getByUser(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<PostResponse> posts = postRepository
                .findByAuthorIdAndStatusOrderByUpdatedAtDesc(userId, PostStatus.PUBLISHED, pageable)
                .stream().map(PostResponse::from).collect(Collectors.toList());
        enrichWithUserInteraction(posts);
        return posts;
    }

    public List<PostResponse> getDrafts(UUID userId) {
        return postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(userId, PostStatus.DRAFT, Pageable.unpaged())
                .stream().map(PostResponse::from).collect(Collectors.toList());
    }

    public List<PostResponse> getSavedPosts(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<SavedPost> savedPosts = savedPostRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return savedPosts.stream().map(sp -> {
            PostResponse resp = PostResponse.from(sp.getPost());
            resp.setSavedByCurrentUser(true);
            return resp;
        }).collect(Collectors.toList());
    }

    // Used later ...
    private void enrichPostResponse(PostResponse response, UUID userId) {
        // Legacy single item enricher if needed
        if (userId != null) {
            response.setSavedByCurrentUser(savedPostRepository.existsByUserIdAndPostId(userId, response.getId()));
            response.setLikedByCurrentUser(likeRepository.existsByPostIdAndUserId(response.getId(), userId));
        }
    }

    // --- OPTIMIZED ENRICHMENT ---
    private void enrichWithUserInteraction(List<PostResponse> posts) {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User currentUser) {
            UUID userId = currentUser.getId();

            // 1. Extract all Post IDs from the current page
            List<UUID> postIds = posts.stream().map(PostResponse::getId).toList();

            if (postIds.isEmpty())
                return;

            // 2. Batch Query: Find all "Saved" entries for these posts by this user
            // You need to add this method to SavedPostRepository (see below)
            Set<UUID> savedPostIds = savedPostRepository.findPostIdsByUserIdAndPostIdIn(userId, postIds);

            // 3. Batch Query: Find all "Liked" entries for these posts by this user
            // You need to add this method to LikeRepository (see below)
            Set<UUID> likedPostIds = likeRepository.findPostIdsByUserIdAndPostIdIn(userId, postIds);

            // 4. Map the results in Memory (Fast Java operation, no DB calls)
            for (PostResponse post : posts) {
                post.setSavedByCurrentUser(savedPostIds.contains(post.getId()));
                post.setLikedByCurrentUser(likedPostIds.contains(post.getId()));
            }
        }
    }

    public PostResponse get(UUID id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        PostResponse dto = PostResponse.from(post);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u) {
            dto.setLikedByCurrentUser(likeRepository.existsByPostIdAndUserId(post.getId(), u.getId()));
            dto.setSavedByCurrentUser(savedPostRepository.existsByUserIdAndPostId(u.getId(), post.getId()));
        }
        return dto;
    }

    @Transactional
    public void clearPostContent(UUID postId, UUID userId) {
        Post post = postRepository.findById(postId).orElseThrow();
        if (!post.getAuthor().getId().equals(userId))
            throw new RuntimeException("Unauthorized");
        chunkRepository.deleteByPostId(postId);
    }

    @Transactional
    public boolean toggleSave(UUID postId, UUID userId) {
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            savedPostRepository.deleteByUserIdAndPostId(userId, postId);
            return false;
        } else {
            User user = userRepository.getReferenceById(userId);
            Post post = postRepository.getReferenceById(postId);
            savedPostRepository.save(SavedPost.builder().user(user).post(post).build());
            return true;
        }
    }

    public List<PostChunkResponse> getContentChunks(UUID postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PostContentChunk> chunks = chunkRepository.findByPostIdOrderByChunkIndexAsc(postId, pageable);
        long totalChunks = chunkRepository.countByPostId(postId);

        return chunks.stream().map(c -> PostChunkResponse.builder()
                .index(c.getChunkIndex())
                .content(c.getContent())
                .isLast((c.getChunkIndex() + 1) == totalChunks)
                .build()).collect(Collectors.toList());
    }

    public void delete(UUID postId, UUID userId, boolean isAdmin) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Not found"));
        if (!isAdmin && !post.getAuthor().getId().equals(userId))
            throw new RuntimeException("Unauthorized");
        postRepository.delete(post);
    }

    public PostResponse update(UUID postId, UUID userId, PostCreateRequest request) {
        Post post = postRepository.findById(postId).orElseThrow();
        if (!post.getAuthor().getId().equals(userId))
            throw new RuntimeException("Unauthorized");

        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        if (request.getMediaUrl() != null)
            post.setMediaUrl(request.getMediaUrl());
        if (request.getMediaType() != null)
            post.setMediaType(request.getMediaType());

        return PostResponse.from(postRepository.save(post));
    }
}