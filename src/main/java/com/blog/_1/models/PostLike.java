package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "post_likes", uniqueConstraints = @UniqueConstraint(columnNames = { "post_id", "user_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostLike extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
