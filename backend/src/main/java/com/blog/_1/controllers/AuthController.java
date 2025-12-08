package com.blog._1.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blog._1.dto.user.UserLoginRequest;
import com.blog._1.dto.user.UserRegisterRequest;
import com.blog._1.services.AuthenticationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationService authService;

    @PostMapping("/login")
    public ResponseEntity<?> postMethodName(@Valid @RequestBody UserLoginRequest request) {
        Map<String, Object> res = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/register")
    public ResponseEntity<?> postMethodName(@Valid @RequestBody UserRegisterRequest request) {
        Map<String, Object> res = authService.register(request.getUsername(), request.getEmail(),
                request.getPassword());
        return ResponseEntity.ok(res);
    }
}
