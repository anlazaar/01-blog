package com.blog._1.dto.user;

import java.util.UUID;

import lombok.Data;

@Data
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String avatarUrl;
    private String firstname;
    private String lastname;
    private String bio;
    private String role;
}
