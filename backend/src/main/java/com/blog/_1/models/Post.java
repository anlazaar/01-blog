package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

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
    private List<PostLike> likes;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostContentChunk> contentChunks;
}