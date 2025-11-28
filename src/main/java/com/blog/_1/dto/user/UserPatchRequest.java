package com.blog._1.dto.user;

import com.blog._1.models.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserPatchRequest {
    private String name;

    @Email(message = "invalid updated email")
    private String email;

    @Size(min = 6, message = "updated password is less than 6 characters")
    private String password;

    private Role role;
}
