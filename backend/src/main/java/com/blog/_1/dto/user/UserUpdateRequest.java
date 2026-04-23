package com.blog._1.dto.user;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, and underscores")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstname;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastname;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password; 

    public void setUsername(String username) {
        this.username = username != null ? username.replaceAll("\\s+", "") : null;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.replaceAll("\\s+", "") : null;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname != null ? firstname.trim() : null;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname != null ? lastname.trim() : null;
    }
}