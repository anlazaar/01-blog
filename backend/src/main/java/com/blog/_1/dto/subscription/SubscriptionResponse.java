package com.blog._1.dto.subscription;

import java.util.UUID;

import lombok.Data;

@Data
public class SubscriptionResponse {
    private UUID id;
    private UUID followerId;
    private UUID followingId;
    private String createdAt;
}
