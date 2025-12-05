package com.blog._1.services;

import com.blog._1.dto.post.PostCreateRequest;
import com.blog._1.dto.post.PostResponse;
import com.blog._1.models.Post;
import com.blog._1.models.User;
import com.blog._1.repositories.LikeRepository;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
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

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

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
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative URL
            return "/uploads/" + filename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }

    // Create Post
    public PostResponse create(String title, String description, String mediaType,
            MultipartFile mediaFile, UUID authorId) {

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description);

        // Handle optional media file
        if (mediaFile != null && !mediaFile.isEmpty()) {
            String mediaUrl = saveFile(mediaFile);
            post.setMediaUrl(mediaUrl);
            post.setMediaType(mediaType);
        }

        post.setAuthor(author);

        Post saved = postRepository.save(post);

        return PostResponse.from(saved);
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
            dto.setLikedByCurrentUser(false); // unauthenticated users haven't liked anything
        }

        return dto;
    }

    // Get all posts
    public List<PostResponse> getAll() {
        return postRepository.findAll()
                .stream().map(PostResponse::from)
                .collect(Collectors.toList());
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
}
