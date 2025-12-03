package com.blog._1.dto.user;

import com.blog._1.models.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserPatchRequest {
    private String username;

    @Email(message = "invalid updated email")
    private String email;

    @Size(min = 6, message = "updated password is less than 6 characters")
    private String password;

    private Role role;

    @Size(min = 10, message = "bio must be at least 10 chars")
    private String bio;

    @Size(min = 2, message = "First name must be at least 2 chars")
    private String firstname;

    @Size(min = 2, message = "Last name must be at least 2 chars")
    private String lastname;

}
