package com.blog._1.services;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public Map<String, Object> login(String email, String passwd) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials")); 

        if (!passwdEnco.matches(passwd, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);

        return Map.of(
                "isCompleted", user.isCompletedAccount(),
                "token", token);
    }

    public Map<String, Object> register(String name, String email, String password) {
        // OPTIMIZATION: existsBy is faster than findBy
        if (userRepo.existsByEmail(email)) {
            throw new RuntimeException("Email already taken");
        }

        User user = new User();
        user.setUsername(name);
        user.setEmail(email);
        user.setPassword(passwdEnco.encode(password));
        user.setRole(Role.USER);

        userRepo.save(user);

        return Map.of("token", jwtService.generateToken(user), "isCompleted", user.isCompletedAccount());
    }
}