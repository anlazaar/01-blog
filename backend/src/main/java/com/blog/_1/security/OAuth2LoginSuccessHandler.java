package com.blog._1.security;

import com.blog._1.models.Role;
import com.blog._1.models.User;
import com.blog._1.repositories.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${application.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = token.getPrincipal();

        // 1. Identify Provider (github or google)
        String provider = token.getAuthorizedClientRegistrationId();

        String email = null;
        String baseUsername = null;
        String avatarUrl = null;

        // 2. Extract Data based on Provider
        if ("google".equalsIgnoreCase(provider)) {
            email = oAuth2User.getAttribute("email");
            avatarUrl = oAuth2User.getAttribute("picture");
            // Google returns "John Doe". We want "johndoe"
            String fullName = oAuth2User.getAttribute("name");
            if (fullName != null) {
                baseUsername = fullName.toLowerCase().replaceAll("\\s+", "");
            } else {
                // Fallback: use part of email before @ if name is missing
                baseUsername = email.split("@")[0];
            }
        } else if ("github".equalsIgnoreCase(provider)) {
            email = oAuth2User.getAttribute("email");
            avatarUrl = oAuth2User.getAttribute("avatar_url");
            baseUsername = oAuth2User.getAttribute("login");

            // GitHub email fallback
            if (email == null) {
                email = baseUsername + "@github.placeholder.com";
            }
        }

        // 3. User Logic (Common for both)
        User user = userRepository.findByEmail(email).orElse(null);
        boolean isNewUser = false;

        if (user == null) {
            // Generate Unique Username
            String candidateUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(candidateUsername)) {
                candidateUsername = baseUsername + counter;
                counter++;
            }

            user = new User();
            user.setEmail(email);
            user.setUsername(candidateUsername);
            user.setRole(Role.USER);
            user.setAvatarUrl(avatarUrl);
            user.setPassword(""); // No password
            user.setCompletedAccount(false);

            userRepository.save(user);
            isNewUser = true;
        }

        // 4. Generate Token & Redirect
        String jwt = jwtService.generateToken(user);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("token", jwt)
                .queryParam("isNew", isNewUser || !user.isCompletedAccount())
                .queryParam("userId", user.getId())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}