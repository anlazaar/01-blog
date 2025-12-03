package com.blog._1.security;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

// import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.blog._1.models.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final String secret = "ec983fd70782eee8d70c0526792f7813762efd4752bab75ef52f632a8bc8510e";
    private final Key secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    private final long EXPIRATION = 1000 * 60 * 60 * 24;


    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("role", user.getRole())
                .claim("username", user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(
                Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody().getSubject());
    }

    public boolean isValidToken(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
