package com.blog._1.config;

import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("anlazaar").isPresent()) {
            return;
        }

        User admin = new User();
        admin.setUsername("anlazaar");
        admin.setFirstname("anass");
        admin.setLastname("lazaar");
        admin.setEmail("anlazaar@01blog.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setBio("01 Blog Admin");
        admin.setCompletedAccount(true);
        admin.setBanned(false);

        userRepository.save(admin);
    }
}