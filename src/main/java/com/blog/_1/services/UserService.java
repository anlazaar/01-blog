package com.blog._1.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.blog._1.dto.post.PostMinimalDTO;
import com.blog._1.dto.user.UserPatchRequest;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.dto.user.UserResponse;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;

    public User createUser(User user) {
        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            throw new RuntimeException("Email already taken");
        }

        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

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

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (currentUser != null && !currentUser.getId().equals(user.getId())) {
            dto.setFollowing(subscriptionService.isFollowing(currentUser.getId(), user.getId()));
        } else {
            dto.setFollowing(false);
        }

        List<PostMinimalDTO> postDTOs = user.getPosts().stream().map(post -> {
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
        dto.setFollowersCount(user.getFollowers().size());
        dto.setFollowingCount(user.getFollowing().size());

        return dto;
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(UUID id, User userNewInfo) {
        User existing = getUserById(id);

        existing.setUsername(userNewInfo.getUsername());
        existing.setEmail(userNewInfo.getEmail());
        // existing.setRole(userNewInfo.getRole());
        existing.setPassword(passwordEncoder.encode(userNewInfo.getPassword()));

        return userRepository.save(existing);
    }

    public String patchUser(UUID userId, String firstname, String lastname, String bio, MultipartFile avatar,
            String email, String password, String oldpassword, String username)
            throws IOException {
        User user = getUserById(userId);

        if (firstname != null && !firstname.equals(""))
            user.setFirstname(firstname);
        if (lastname != null && !lastname.equals(""))
            user.setLastname(lastname);
        if (lastname != null && !bio.equals(""))
            user.setBio(bio);

        if (avatar != null && !avatar.isEmpty()) {
            // Save file
            String filename = UUID.randomUUID() + "_" + avatar.getOriginalFilename();
            Path uploadPath = Paths.get("uploads/avatars");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(filename);
            Files.copy(avatar.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            user.setAvatarUrl("/uploads/avatars/" + filename);
        }

        if (lastname != null && firstname != null && bio != null && !firstname.equals("") && !lastname.equals("")
                && !bio.equals("")) {
            user.setCompletedAccount(true);
        }

        // Update email
        if (email != null && !email.equals("") && !email.isBlank() && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(email);
        }

        // Update username
        if (username != null && !username.equals("") && !username.isBlank() && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username already in use");
            }
            user.setUsername(username);
        }

        // Update password
        if ((password != null && oldpassword != null) && !password.equals("") && !oldpassword.equals("")) {
            // System.out.println("I'M HERE!!" + oldpassword + " " + password);
            PasswordEncoder encoder = new BCryptPasswordEncoder();
            if (encoder.matches(oldpassword, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(password));
            } else {
                throw new IllegalArgumentException("Old password does not match");
            }
        }

        userRepository.save(user);
        return "User updated seccusfuly";
    }

    // ========================
    // Admin-only routes
    // ========================

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void banUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBanned(true);
        userRepository.save(user);
    }

    // ========================
    // Subscription functionality
    // ========================

    public void subscribeToUser(UUID targetUserId) {
        User target = getUserById(targetUserId);
        // TODO: Implement subscription logic (add current user to target's subscribers)
        // e.g., target.getSubscribers().add(currentUser);
        // userRepository.save(target);
    }

    public void unsubscribeFromUser(UUID targetUserId) {
        User target = getUserById(targetUserId);
        // TODO: Implement unsubscribe logic (remove current user from target's
        // subscribers)
        // e.g., target.getSubscribers().remove(currentUser);
        // userRepository.save(target);
    }
}
