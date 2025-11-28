package com.blog._1.dto.user;

import java.util.UUID;

import lombok.Data;

@Data
public class UserPublicProfileDTO {
    private UUID id;
    private String username;
    private String bio;
    private String avatarUrl;
    private int followersCount;
    private int followingCount;
}
