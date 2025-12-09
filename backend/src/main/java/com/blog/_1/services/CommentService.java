package com.blog._1.services;

import com.blog._1.dto.comment.CommentCreateRequest;
import com.blog._1.dto.comment.CommentResponse;
import com.blog._1.dto.user.UserPublicProfileDTO;
import com.blog._1.models.Comment;
import com.blog._1.repositories.CommentRepository;
import com.blog._1.repositories.PostRepository;
import com.blog._1.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentResponse create(UUID postId, UUID userId, CommentCreateRequest request) {
        // OPTIMIZATION: getReferenceById creates a proxy.
        // It doesn't hit the DB if we only need to set the FK relationship.
        var post = postRepository.getReferenceById(postId);
        var author = userRepository.getReferenceById(userId);

        Comment comment = new Comment();
        comment.setText(request.getText());
        comment.setPost(post);
        comment.setAuthor(author);

        Comment saved = commentRepository.save(comment);
        return mapToResponse(saved);
    }

    // NEW METHOD: Pagination for comments
    public List<CommentResponse> getComments(UUID postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return commentRepository.findByPostId(postId, pageable)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void delete(UUID commentId, UUID userId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!isAdmin && !comment.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("You cannot delete this comment");
        }
        commentRepository.delete(comment);
    }

    private CommentResponse mapToResponse(Comment saved) {
        CommentResponse c = new CommentResponse();
        c.setId(saved.getId());
        c.setText(saved.getText());
        c.setCreatedAt(saved.getCreatedAt());

        // Note: This might trigger a fetch for Author if not already loaded,
        // but it's necessary for the UI.
        UserPublicProfileDTO commentAuthor = new UserPublicProfileDTO();
        commentAuthor.setId(saved.getAuthor().getId());
        commentAuthor.setUsername(saved.getAuthor().getUsername());
        commentAuthor.setAvatarUrl(saved.getAuthor().getAvatarUrl());
        c.setAuthor(commentAuthor);
        return c;
    }
}