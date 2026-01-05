package com.blog._1.controllers;


import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.blog._1.dto.stage.SignalMessage;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class StageSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * WebRTC Signaling Relay
     * Client sends to: /app/stage/{stageId}/signal
     * Payload contains: { type: "OFFER", targetId: "...", sdp: "..." }
     */
    @MessageMapping("/stage/{stageId}/signal")
    public void handleSignal(@DestinationVariable UUID stageId, @Payload SignalMessage message) {
        // If targetId is present, send only to that specific user
        if (message.getTargetId() != null) {
            // Send to specific user queue: /topic/stage/{stageId}/user/{userId}
            messagingTemplate.convertAndSend(
                    "/topic/stage/" + stageId + "/user/" + message.getTargetId(),
                    message);
        } else {
            // Broadcast to everyone (usually for "JOIN" events)
            messagingTemplate.convertAndSend("/topic/stage/" + stageId, message);
        }
    }
}