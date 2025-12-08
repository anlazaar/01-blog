package com.blog._1.security;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.blog._1.models.User;
import com.blog._1.services.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserService userService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = null;

        // 1. Try to get token from Authorization Header
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2. If not in Header, try to get from Query Parameter (For SSE/Notifications)
        if (token == null) {
            token = request.getParameter("token");
        }

        // 3. If token is still null, continue filter chain (User is anonymous)
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final UUID userId = jwtService.extractUserId(token);
            final String role = jwtService.extractRole(token);

            if (userId != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                if (!jwtService.isValidToken(token)) {
                    writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                    return;
                }

                User userDetails = userService.getUserById(userId);

                // ---------------------------
                // BLOCK BANNED USERS
                // ---------------------------
                if (userDetails.isBanned()) {
                    writeJsonError(response, HttpServletResponse.SC_FORBIDDEN, "Your account has been banned");
                    return;
                }

                Collection<? extends GrantedAuthority> authorities = List
                        .of(new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        null, authorities);

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

        } catch (Exception e) {
            // For standard API calls, we return 401.
            // For SSE, the browser will see the error and close the connection.
            writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token expired or invalid");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeJsonError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

}