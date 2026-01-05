package com.blog._1.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker
        config.enableSimpleBroker("/topic", "/queue");
        // /topic = one-to-many (e.g., someone joined)
        // /queue = one-to-one (e.g., specific WebRTC signal to a user)

        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint Angular will connect to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure specific origins in prod
                .withSockJS();
    }
}