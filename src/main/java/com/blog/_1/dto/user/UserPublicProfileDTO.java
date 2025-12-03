package com.blog._1.dto.user;

import java.util.List;
import java.util.UUID;

import com.blog._1.dto.post.PostMinimalDTO;

import lombok.Data;

@Data
public class UserPublicProfileDTO {
    private UUID id;
    private String username;
    private String firstname;
    private String lastname;
    private String bio;
    private String avatarUrl;
    private int followersCount;
    private int followingCount;
    private boolean isFollowing;
    private List<PostMinimalDTO> posts;
}
