package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "post_content_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostContentChunk {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(columnDefinition = "TEXT") // Allows large text per chunk
    private String content;

    @Column(nullable = false)
    private Integer chunkIndex; // 0, 1, 2... to maintain order

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
}