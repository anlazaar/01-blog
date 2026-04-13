package com.blog._1.services;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.blog._1.dto.post.CacheablePage;
import com.blog._1.dto.post.PostMinimalDTO;
import com.blog._1.dto.user.ProfilePatchRequest;
import com.blog._1.dto.user.UserUpdateRequest;
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

    @Autowired
    private ApplicationContext applicationContext;

    private UserService getSelf() {
        return applicationContext.getBean(UserService.class);
    }

    // --- HELPER ---
    private User getUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    // --- 1. BASIC CRUD ---

    public User getUserById(UUID id) {
        return getUserOrThrow(id);
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already taken");
        }
        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "single_user", key = "#id"),
            @CacheEvict(value = "user_pages", allEntries = true)
    })
    public User updateUser(UUID id, UserUpdateRequest request) {
        User user = getUserOrThrow(id);

        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        if (!user.getUsername().equals(request.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
            }
            user.setUsername(request.getUsername());
        }

        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setBio(request.getBio());

        if (hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
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
        dto.setRole(user.getRole().name());
        return dto;
    }

    // CACHED BASE PROFILE
    @Transactional(readOnly = true)
    @Cacheable(value = "single_user", key = "#userId")
    public UserPublicProfileDTO getBasePublicProfile(UUID userId) {
        User user = getUserOrThrow(userId);
        UserPublicProfileDTO dto = new UserPublicProfileDTO();

        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstname(user.getFirstname());
        dto.setLastname(user.getLastname());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setFollowersCount((int) subscriptionRepository.countByFollowingId(user.getId()));
        dto.setFollowingCount((int) subscriptionRepository.countByFollowerId(user.getId()));
        dto.setFollowing(false); // Default to false for Cache

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
        return dto;
    }

    // NOTE: Changed signature from (User user) to (UUID userId) to optimize caching
    // layer
    public UserPublicProfileDTO getPublicProfile(UUID userId) {
        // 1. Get Cache-safe base DTO
        UserPublicProfileDTO cachedDto = getSelf().getBasePublicProfile(userId);

        // 2. Enrich with specific user connection status
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User currentUser
                && !currentUser.getId().equals(userId)) {

            cachedDto.setFollowing(
                    subscriptionRepository.findByFollowerIdAndFollowingId(currentUser.getId(), userId).isPresent());
        }

        return cachedDto;
    }

    // CACHED ALL USERS PAGE
    @Cacheable(value = "user_pages", key = "'all_' + #page + '_' + #size")
    public CacheablePage<UserPublicProfileDTO> getBaseAllPublicUsers(int page, int size) {
        Page<UserPublicProfileDTO> pageData = userRepository.findAllUserSummaries(PageRequest.of(page, size));
        return new CacheablePage<>(pageData.getContent(), page, size, pageData.getTotalElements());
    }

    public Page<UserPublicProfileDTO> getAllPublicUsers(UUID currentUserId, Pageable pageable) {
        // 1. Fetch from Cache using CacheablePage
        CacheablePage<UserPublicProfileDTO> cachedPage = getSelf().getBaseAllPublicUsers(
                pageable.getPageNumber(),
                pageable.getPageSize());

        List<UserPublicProfileDTO> content = cachedPage.getContent();

        // 2. Enrich with Following interactions
        if (currentUserId != null && !content.isEmpty()) {
            List<UUID> userIdsOnPage = content.stream().map(UserPublicProfileDTO::getId).toList();
            Set<UUID> followingIds = subscriptionRepository.findFollowingIdsByFollowerIdAndFollowingIdIn(
                    currentUserId, userIdsOnPage);

            content.forEach(dto -> {
                dto.setFollowing(followingIds.contains(dto.getId()));
                dto.setPosts(Collections.emptyList());
            });
        }

        // 3. Map back to Spring PageImpl
        return new PageImpl<>(content, pageable, cachedPage.getTotalElements());
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

    // --- 3. ADMIN METHODS ---

    public Page<User> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size));
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "single_user", key = "#id"),
            @CacheEvict(value = "user_pages", allEntries = true)
    })
    public void banUser(UUID id) {
        User user = getUserById(id);
        user.setBanned(!user.isBanned());
        userRepository.save(user);
    }

    @Caching(evict = {
            @CacheEvict(value = "single_user", key = "#id"),
            @CacheEvict(value = "user_pages", allEntries = true)
    })
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    // --- 4. PROFILE PATCHING ---

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "single_user", key = "#userId"),
            @CacheEvict(value = "user_pages", allEntries = true)
    })
    public String patchUser(UUID userId, ProfilePatchRequest request) throws IOException {
        User user = getUserById(userId);
        boolean isProfileUpdated = false;

        if (hasText(request.getFirstname())) {
            user.setFirstname(request.getFirstname());
            isProfileUpdated = true;
        }
        if (hasText(request.getLastname())) {
            user.setLastname(request.getLastname());
            isProfileUpdated = true;
        }
        if (hasText(request.getBio())) {
            user.setBio(request.getBio());
            isProfileUpdated = true;
        }

        if (request.getAvatar() != null && !request.getAvatar().isEmpty()) {
            validateImage(request.getAvatar());

            String filename = UUID.randomUUID() + "_" + request.getAvatar().getOriginalFilename();
            Path uploadPath = Paths.get("uploads/avatars");
            if (!Files.exists(uploadPath))
                Files.createDirectories(uploadPath);
            Files.copy(request.getAvatar().getInputStream(), uploadPath.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING);

            user.setAvatarUrl("/uploads/avatars/" + filename);
            isProfileUpdated = true;
        }

        if (isProfileUpdated && hasText(user.getFirstname()) && hasText(user.getLastname()) && hasText(user.getBio())) {
            user.setCompletedAccount(true);
        }

        if (hasText(request.getEmail()) && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email taken");
            user.setEmail(request.getEmail());
        }

        if (hasText(request.getUsername()) && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username taken");
            user.setUsername(request.getUsername());
        }

        if (hasText(request.getPassword())) {
            if (!hasText(request.getOldpassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(request.getOldpassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return "User updated successfully";
    }

    @Caching(evict = {
            @CacheEvict(value = "single_user", key = "#userId"),
            @CacheEvict(value = "user_pages", allEntries = true)
    })
    public void updateUserRole(UUID userId, Role newRole) {
        User user = getUserById(userId);
        user.setRole(newRole);
        userRepository.save(user);
    }

    private void validateImage(MultipartFile file) {
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File too large");
        }
    }
}