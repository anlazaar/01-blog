package com.blog._1.dto.user;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProfilePatchRequest {

    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, and underscores")
    private String username;

    private String oldpassword;

    @Size(min = 6, message = "New password must be at least 6 characters")
    private String password;

    @Size(min = 2, max = 50)
    private String firstname;

    @Size(min = 2, max = 50)
    private String lastname;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;

    private MultipartFile avatar;
}