package com.blog._1.services;

import com.blog._1.dto.post.ChunkUploadRequest;
import com.blog._1.dto.post.PostChunkResponse;
import com.blog._1.dto.post.PostCreateRequest;
import com.blog._1.dto.post.PostPatchRequest;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.models.Post;
import com.blog._1.models.PostContentChunk;
import com.blog._1.models.PostStatus;
import com.blog._1.models.SavedPost;
import com.blog._1.models.User;
import com.blog._1.repositories.LikeRepository;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.SavedPostRepository;
import com.blog._1.repositories.SubscriptionRepository;
import com.blog._1.repositories.UserRepository;
import com.blog._1.repositories.PostContentChunkRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
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

    /**
     * Internal method to save raw files to disk
     */
    private String saveFile(MultipartFile file) {
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            // Ensure unique name
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative URL for frontend access
            return "/uploads/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }

    /**
     * NEW: Handles standalone media uploads for the Editor.
     * Enforces: < 20MB, Image or Video only.
     */
    public String uploadPostMedia(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        // 1. Validate Size (20MB = 20 * 1024 * 1024 bytes)
        long maxSize = 20 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the 20MB limit.");
        }

        // 2. Validate MIME Type (Image or Video)
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new RuntimeException("Only image and video files are allowed.");
        }

        // 3. Save via existing workflow
        return saveFile(file);
    }

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

    // Create Post (Metadata)
    @Transactional
    public PostResponse initPost(String title, String summary, String mediaType,
            MultipartFile mediaFile, UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = new Post();
        post.setTitle(title);
        post.setDescription(summary);
        post.setAuthor(author);
        post.setStatus(PostStatus.DRAFT); // Start as Draft

        if (mediaFile != null && !mediaFile.isEmpty()) {
            // We use the internal saveFile here as validation is handled by logic/frontend
            // for cover
            post.setMediaUrl(saveFile(mediaFile));
            post.setMediaType(mediaType);
        }

        return PostResponse.from(postRepository.save(post));
    }

    @Transactional
    public void uploadChunk(ChunkUploadRequest request, UUID userId) {
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Logic Check: Prevent duplicates or huge blobs
        if (request.getContent().length() > 10000) {
            throw new RuntimeException("Chunk too large");
        }

        PostContentChunk chunk = PostContentChunk.builder()
                .post(post)
                .chunkIndex(request.getIndex())
                .content(request.getContent())
                .build();

        chunkRepository.save(chunk);
    }

    @Transactional
    public PostResponse finalizePost(UUID postId, UUID userId, int expectedTotalChunks) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        long actualCount = chunkRepository.countByPostId(postId);
        if (actualCount != expectedTotalChunks) {
            throw new RuntimeException(
                    "Upload incomplete. Expected " + expectedTotalChunks + " chunks but found " + actualCount);
        }

        post.setStatus(PostStatus.PUBLISHED);
        Post savedPost = postRepository.save(post);

        try {
            List<User> followers = subscriptionRepository.findByFollowing_Id(userId).stream()
                    .map(sub -> sub.getFollower())
                    .toList();

            // Add a log for debugging
            System.out.println("Found " + followers.size() + " followers for user " + userId);

            if (!followers.isEmpty()) {
                notificationService.notifyFollowers(savedPost, followers);
            }
        } catch (Exception e) {
            System.err.println("Failed to send notifications: " + e.getMessage());
            e.printStackTrace();
        }

        return PostResponse.from(savedPost);
    }

    public List<PostChunkResponse> getContentChunks(UUID postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PostContentChunk> chunks = chunkRepository.findByPostIdOrderByChunkIndexAsc(postId, pageable);
        long totalChunksForPost = chunkRepository.countByPostId(postId);

        return chunks.stream().map(c -> PostChunkResponse.builder()
                .index(c.getChunkIndex())
                .content(c.getContent())
                .isLast((c.getChunkIndex() + 1) == totalChunksForPost)
                .build()).collect(Collectors.toList());
    }

    // Get single post
    public PostResponse get(UUID id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        PostResponse dto = PostResponse.from(post);

        // Only set likedByCurrentUser if someone is authenticated
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof String)) {
            User currentUser = (User) auth.getPrincipal();
            UUID currentUserId = currentUser.getId();
            boolean liked = likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
            dto.setLikedByCurrentUser(liked);
        } else {
            dto.setLikedByCurrentUser(false);
        }

        return dto;
    }

    // Get all posts
    public List<PostResponse> getAll() {
        // 1. Fetch raw posts
        List<PostResponse> posts = postRepository.findAllByStatus(PostStatus.PUBLISHED)
                .stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());

        // 2. Check if a user is currently logged in
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
            User currentUser = (User) auth.getPrincipal();

            // 3. Loop through posts and check if saved/liked by THIS user
            for (PostResponse post : posts) {
                enrichPostResponse(post, currentUser.getId());
            }
        }

        return posts;
    }

    // Get Draft posts
    public List<PostResponse> getDrafts(UUID userId) {
        return postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(userId, PostStatus.DRAFT)
                .stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearPostContent(UUID postId, UUID userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete all existing chunks so we can re-upload new version
        chunkRepository.deleteByPostId(postId);
    }

    // Get posts by user
    public List<PostResponse> getByUser(UUID userId) {
        return postRepository.findByAuthorId(userId)
                .stream().map(PostResponse::from)
                .collect(Collectors.toList());
    }

    // Update post (only author can update)
    public PostResponse update(UUID postId, UUID userId, PostCreateRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to edit this post");
        }

        // --- FIX: Update Title ---
        post.setTitle(request.getTitle());
        // -------------------------

        post.setDescription(request.getDescription());
        post.setMediaUrl(request.getMediaUrl());
        post.setMediaType(request.getMediaType());

        Post updated = postRepository.save(post);
        return PostResponse.from(updated);
    }

    // Delete post (only author or admin)
    public void delete(UUID postId, UUID userId, boolean isAdmin) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!isAdmin && !post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to delete this post");
        }

        postRepository.delete(post);
    }

    @Transactional
    public boolean toggleSave(UUID postId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (savedPostRepository.existsByUserAndPost(user, post)) {
            savedPostRepository.deleteByUserAndPost(user, post);
            return false; // Not saved anymore
        } else {
            SavedPost saved = SavedPost.builder().user(user).post(post).build();
            savedPostRepository.save(saved);
            return true; // Now saved
        }
    }

    public List<PostResponse> getSavedPosts(UUID userId) {
        List<SavedPost> savedPosts = savedPostRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return savedPosts.stream()
                .map(sp -> {
                    PostResponse resp = PostResponse.from(sp.getPost());
                    resp.setSavedByCurrentUser(true); // Obviously true here
                    // You might want to set likedByCurrentUser here too via repository check
                    return resp;
                })
                .collect(Collectors.toList());
    }

    private void enrichPostResponse(PostResponse response, UUID userId) {
        if (userId != null) {
            boolean isSaved = savedPostRepository.existsByUserAndPost(
                    userRepository.getReferenceById(userId),
                    postRepository.getReferenceById(response.getId()));
            response.setSavedByCurrentUser(isSaved);

            boolean isLiked = likeRepository.existsByPostIdAndUserId(response.getId(), userId);
            response.setLikedByCurrentUser(isLiked);
        }
    }
}