package com.blog._1.dto.stage;

import lombok.Data;
import java.util.UUID;

@Data
public class SignalMessage {
    private String type; // "OFFER", "ANSWER", "ICE", "JOIN", "LEAVE"
    private String sdp; // Session Description Protocol (for Offer/Answer)
    private Object candidate; // ICE Candidate
    private UUID senderId;
    private UUID targetId; // Who needs to receive this signal?
}