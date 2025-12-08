package com.blog._1.repositories;

import com.blog._1.models.Post;
import com.blog._1.models.SavedPost;
import com.blog._1.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
    boolean existsByUserAndPost(User user, Post post);

    void deleteByUserAndPost(User user, Post post);

    List<SavedPost> findByUserIdOrderByCreatedAtDesc(UUID userId);
}