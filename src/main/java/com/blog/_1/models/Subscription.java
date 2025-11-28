package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "subscriptions", uniqueConstraints = @UniqueConstraint(columnNames = { "follower_id", "following_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subscription extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "follower_id")
    private User follower;

    @ManyToOne
    @JoinColumn(name = "following_id")
    private User following;
}