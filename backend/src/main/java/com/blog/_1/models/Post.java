package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

import org.hibernate.annotations.Formula;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Post extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    private String title;

    @Column(length = 500)
    private String description; // Summary

    private String mediaUrl;
    private String mediaType;

    @Enumerated(EnumType.STRING)
    private PostStatus status = PostStatus.DRAFT; // Default to DRAFT

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PostLike> likes;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Comment> comments;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostContentChunk> contentChunks;

    @Formula("(SELECT count(c.id) FROM comments c WHERE c.post_id = id)")
    private long commentCount;

    @Formula("(SELECT count(l.id) FROM post_likes l WHERE l.post_id = id)")
    private long likeCount;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications;
}