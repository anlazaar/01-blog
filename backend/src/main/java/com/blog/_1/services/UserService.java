package com.blog._1.services;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.blog._1.dto.post.PostMinimalDTO;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.dto.user.UserResponse;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.SubscriptionRepository;
import com.blog._1.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    // --- 1. BASIC CRUD (Restored getUserById & updateUser) ---

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already taken");
        }
        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Used for full updates (PUT)
    public User updateUser(UUID id, User userNewInfo) {
        User existing = getUserById(id);
        existing.setUsername(userNewInfo.getUsername());
        existing.setEmail(userNewInfo.getEmail());
        // Only update password if actually provided
        if (userNewInfo.getPassword() != null && !userNewInfo.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(userNewInfo.getPassword()));
        }
        return userRepository.save(existing);
    }

    // --- 2. PUBLIC PROFILES ---

    public UserResponse getFullUserData(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstname(user.getFirstname());
        dto.setLastname(user.getLastname());
        dto.setBio(user.getBio());
        dto.setEmail(user.getEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    public UserPublicProfileDTO getPublicProfile(User user) {
        UserPublicProfileDTO dto = new UserPublicProfileDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstname(user.getFirstname());
        dto.setLastname(user.getLastname());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());

        // Follow Status
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User currentUser
                && !currentUser.getId().equals(user.getId())) {
            dto.setFollowing(subscriptionRepository.findByFollowerIdAndFollowingId(currentUser.getId(), user.getId())
                    .isPresent());
        }

        // Optimization: Fetch only latest 6 posts
        List<PostMinimalDTO> postDTOs = postRepository.findByAuthorId(user.getId(), PageRequest.of(0, 6))
                .stream().map(post -> {
                    PostMinimalDTO p = new PostMinimalDTO();
                    p.setId(post.getId());
                    p.setTitle(post.getTitle());
                    p.setMediaUrl(post.getMediaUrl());
                    p.setMediaType(post.getMediaType());
                    p.setAuthorUsername(user.getUsername());
                    p.setCreatedAt(post.getCreatedAt());
                    return p;
                }).toList();

        dto.setPosts(postDTOs);
        dto.setFollowersCount((int) subscriptionRepository.countByFollowingId(user.getId()));
        dto.setFollowingCount((int) subscriptionRepository.countByFollowerId(user.getId()));

        return dto;
    }

    // Restored: getAllPublicUsers (Mapped to DTO)
    public List<UserPublicProfileDTO> getAllPublicUsers(UUID currentUserId) {
        // Optimization note: In production, this needs pagination!
        List<User> users = userRepository.findAll();

        return users.stream().map(user -> {
            UserPublicProfileDTO dto = new UserPublicProfileDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setBio(user.getBio());
            dto.setAvatarUrl(user.getAvatarUrl());

            if (currentUserId != null && !currentUserId.equals(user.getId())) {
                boolean isFollowing = subscriptionRepository.findByFollowerIdAndFollowingId(currentUserId, user.getId())
                        .isPresent();
                dto.setFollowing(isFollowing);
            } else {
                dto.setFollowing(false);
            }
            return dto;
        }).collect(Collectors.toList());
    }

    public List<UserPublicProfileDTO> getSuggestedUsers(UUID currentUserId) {
        List<User> users;
        int limit = 3;
        if (currentUserId == null) {
            users = userRepository.findAll(PageRequest.of(0, limit)).toList();
        } else {
            users = userRepository.findSuggestedUsers(currentUserId, limit);
        }

        return users.stream().map(user -> {
            UserPublicProfileDTO dto = new UserPublicProfileDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setBio(user.getBio());
            dto.setAvatarUrl(user.getAvatarUrl());
            return dto;
        }).toList();
    }

    // --- 3. ADMIN METHODS (Restored) ---

    // Restored: getAllUsers (Returns Entities for Admin Dashboard)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Restored: banUser
    @Transactional
    public void banUser(UUID id) {
        User user = getUserById(id);
        user.setBanned(!user.isBanned()); // Toggle ban status
        userRepository.save(user);
    }

    // Restored: deleteUser
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    // --- 4. PROFILE PATCHING ---

    public String patchUser(UUID userId, String firstname, String lastname, String bio, MultipartFile avatar,
            String email, String password, String oldpassword, String username) throws IOException {
        User user = getUserById(userId);

        boolean isProfileUpdated = false;

        if (hasText(firstname)) {
            user.setFirstname(firstname);
            isProfileUpdated = true;
        }
        if (hasText(lastname)) {
            user.setLastname(lastname);
            isProfileUpdated = true;
        }
        if (hasText(bio)) {
            user.setBio(bio);
            isProfileUpdated = true;
        }

        if (avatar != null && !avatar.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + avatar.getOriginalFilename();
            Path uploadPath = Paths.get("uploads/avatars");
            if (!Files.exists(uploadPath))
                Files.createDirectories(uploadPath);
            Files.copy(avatar.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarUrl("/uploads/avatars/" + filename);
            isProfileUpdated = true;
        }

        if (isProfileUpdated && hasText(user.getFirstname()) && hasText(user.getLastname()) && hasText(user.getBio())) {
            user.setCompletedAccount(true);
        }

        if (hasText(email) && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email))
                throw new IllegalArgumentException("Email taken");
            user.setEmail(email);
        }

        if (hasText(username) && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username))
                throw new IllegalArgumentException("Username taken");
            user.setUsername(username);
        }

        if (hasText(password) && hasText(oldpassword)) {
            if (!passwordEncoder.matches(oldpassword, user.getPassword())) {
                throw new IllegalArgumentException("Old password incorrect");
            }
            user.setPassword(passwordEncoder.encode(password));
        }

        userRepository.save(user);
        return "User updated successfully";
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}