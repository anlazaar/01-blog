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
import com.blog._1.security.OAuth2LoginSuccessHandler;
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
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

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

                        // PUBLIC ROUTES
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}/block").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                        // Ensure serving uploaded files is public
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // USER ROUTES
                        // Explicitly allow Media Upload (POST)
                        .requestMatchers(HttpMethod.POST, "/api/posts/media/upload").hasRole("USER")

                        // General Post CRUD
                        .requestMatchers(HttpMethod.GET, "/api/users/{id}").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/posts").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PATCH, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/posts/{id}/save").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/posts/saved").hasRole("USER")

                        // Other User Routes
                        .requestMatchers("/api/comments/**").hasRole("USER")
                        .requestMatchers("/api/likes/**").hasRole("USER")
                        .requestMatchers("/api/subscriptions/**").hasRole("USER")
                        .requestMatchers("/api/notifications/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/reports/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile/update/**").hasRole("USER")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").hasRole("USER")

                        // ADMIN ROUTES
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reports/**").hasRole("ADMIN")

                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler))
                .addFilterBefore(new JwtAuthFilter(jwtService, userService),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}