package com.blog._1.dto.user;

import java.util.UUID;
import com.blog._1.models.Role;
import com.blog._1.models.User;
import lombok.Data;

@Data
public class AdminUserDTO {
    private UUID id;
    private String username;
    private String email;
    private Role role;
    private String avatarUrl;
    private boolean banned;
    private boolean completedAccount;

    // Static mapper method (like you did in PostResponse)
    public static AdminUserDTO from(User user) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBanned(user.isBanned());
        dto.setCompletedAccount(user.isCompletedAccount());
        return dto;
    }
}