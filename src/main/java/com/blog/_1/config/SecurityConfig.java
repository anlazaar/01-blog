package com.blog._1.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.blog._1.security.JwtAuthFilter;
import com.blog._1.security.JwtService;
import com.blog._1.services.UserService;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserService userService;

    // ---------------------------
    // CORS for Angular
    // ---------------------------
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:4200");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth

                        // ------------------------------------------
                        // PUBLIC ROUTES
                        // ------------------------------------------
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()

                        // Public block page + public posts
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/block").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // ------------------------------------------
                        // USER ROUTES (ROLE_USER)
                        // ------------------------------------------
                        // Post CRUD
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/posts").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PATCH, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasRole("USER")

                        // Comments
                        .requestMatchers("/api/comments/**").hasRole("USER")

                        // Likes
                        .requestMatchers("/api/likes/**").hasRole("USER")

                        // Subscriptions (follow)
                        .requestMatchers("/api/subscriptions/**").hasRole("USER")

                        // Notifications
                        .requestMatchers("/api/notifications/**").hasRole("USER")

                        // Report creation
                        .requestMatchers(HttpMethod.POST, "/api/reports/**").hasRole("USER")

                        // User profile editing
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile/update/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasRole("USER")

                        // ------------------------------------------
                        // ADMIN ROUTES
                        // ------------------------------------------
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Reports dashboard
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reports/**").hasRole("ADMIN")

                        // Any other request must be authenticated
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService, userService),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
