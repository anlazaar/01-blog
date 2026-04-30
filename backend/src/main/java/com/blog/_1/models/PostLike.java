package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "post_likes", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "post_id", "user_id" })
}, indexes = {
                @Index(name = "idx_post_likes_post_id", columnList = "post_id"),
                @Index(name = "idx_post_likes_user_id", columnList = "user_id"),
                @Index(name = "idx_post_likes_user_post", columnList = "user_id, post_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostLike extends BaseEntity {

        @Id
        @GeneratedValue
        private UUID id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        @JsonIgnore
        private Post post;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        @JsonIgnore
        private User user;
}
