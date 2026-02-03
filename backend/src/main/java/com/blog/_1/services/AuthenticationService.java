package com.blog._1.services;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public Map<String, Object> login(UserLoginRequest request) {
        String identifier = request.getEmail(); // Could be email OR username --CHANGED LATER FOR BETTER PERFORMANCE
                                                // USING ONLY EMAIL FOR THE MOMENT

        User user = userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByUsername(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        // 2. Check Password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // 3. SECURITY: Check if Banned
        if (user.isBanned()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned. Contact admin.");
        }

        String token = jwtService.generateToken(user);

        return Map.of(
                "token", token,
                "isCompleted", user.isCompletedAccount(),
                "role", user.getRole(),
                "id", user.getId() // Useful for frontend routing
        );
    }

    @Transactional
    public Map<String, Object> register(UserRegisterRequest request) {
        // 1. Fail Fast - Check Duplicates
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already taken");
        }
        if (userRepo.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        // 2. Create User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setCompletedAccount(false);
        user.setBanned(false);

        userRepo.save(user);

        // 3. Generate Token immediately so they don't have to login again
        return Map.of(
                "token", jwtService.generateToken(user),
                "isCompleted", user.isCompletedAccount(),
                "role", user.getRole(),
                "id", user.getId());
    }
}