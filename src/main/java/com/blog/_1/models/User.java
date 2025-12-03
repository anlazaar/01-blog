package com.blog._1.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    private String firstname;
    private String lastname;
    private String bio;
    private String avatarUrl;

    @Column(nullable = false)
    private boolean completedAccount;

    @Column(nullable = false)
    private boolean banned = false;

    // Followers / Following
    @OneToMany(mappedBy = "follower")
    private List<Subscription> following;

    @OneToMany(mappedBy = "following")
    private List<Subscription> followers;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Post> posts;

}
