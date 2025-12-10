package com.blog._1.dto.user;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.blog._1.dto.post.PostMinimalDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor // Useful for serialization
@AllArgsConstructor // Keep this for other usages if needed
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

    public UserPublicProfileDTO(UUID id, String username, String firstname, String lastname,
            String bio, String avatarUrl, Long followersCount, Long followingCount) {
        this.id = id;
        this.username = username;
        this.firstname = firstname;
        this.lastname = lastname;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.followersCount = followersCount != null ? followersCount.intValue() : 0;
        this.followingCount = followingCount != null ? followingCount.intValue() : 0;

        this.isFollowing = false;
        this.posts = Collections.emptyList();
    }
}