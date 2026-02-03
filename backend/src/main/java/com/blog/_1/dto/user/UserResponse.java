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

    // I keep this as String for JSON compatibility,
    // but I must map it carefully in the Service (see note below).
    private String role;
}