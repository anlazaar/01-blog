package com.blog._1.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.blog._1.dto.user.UserPatchRequest;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(User user) {
        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            throw new RuntimeException("Email already taken");
        }

        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
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

    public User patchUser(UUID id, UserPatchRequest req) {
        User user = getUserById(id);

        if (req.getName() != null)
            user.setUsername(req.getName());
        if (req.getPassword() != null)
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        if (req.getEmail() != null) {
            if (userRepository.findByEmail(req.getEmail()).isPresent()) {
                throw new RuntimeException("Email already taken");
            }
            user.setEmail(req.getEmail());
        }
        user.setRole(Role.USER);

        return userRepository.save(user);
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
