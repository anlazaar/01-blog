package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Report extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 500)
    private String reason;

    @ManyToOne
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    private boolean resolved = false;
}