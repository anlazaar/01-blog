package com.blog._1.repositories;

import com.blog._1.models.Post;
import com.blog._1.models.PostStatus;
import com.blog._1.models.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    List<Post> findByAuthor(User author);

    List<Post> findByAuthorId(UUID authorId);

    List<Post> findByStatus(PostStatus status);

    List<Post> findAllByCreatedAtAfter(LocalDateTime date);
}
