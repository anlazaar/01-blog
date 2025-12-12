package com.blog._1.services;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blog._1.dto.user.UserLoginRequest;
import com.blog._1.dto.user.UserRegisterRequest;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;
import com.blog._1.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwdEnco;
    private final JwtService jwtService;

    public Map<String, Object> login(UserLoginRequest request) {
        // OPTIMIZATION: Check for Email OR Username in a single query.
        // Assumes the input field in DTO is named 'email' but handles both.
        String loginIdentifier = request.getEmail();

        User user = userRepo.findByEmailOrUsername(loginIdentifier, loginIdentifier)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwdEnco.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);

        return Map.of(
                "isCompleted", user.isCompletedAccount(),
                "token", token);
    }

    @Transactional // Ensures user is saved only if everything succeeds
    public Map<String, Object> register(UserRegisterRequest request) {
        // OPTIMIZATION: Fail fast if data exists
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already taken");
        }
        if (userRepo.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwdEnco.encode(request.getPassword()));
        user.setRole(Role.USER);

        userRepo.save(user);

        return Map.of(
                "token", jwtService.generateToken(user),
                "isCompleted", user.isCompletedAccount());
    }
}