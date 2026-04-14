package com.blog._1.specifications;

import com.blog._1.models.*;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PostSpecification {

    public static Specification<Post> buildSearchSpec(
            String keyword, String author, List<String> tags,
            Boolean liked, Boolean followed, UUID currentUserId) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Rule 1: Always ensure distinct results when joining collections
            query.distinct(true);

            // Rule 2: Only show published posts
            predicates.add(cb.equal(root.get("status"), PostStatus.PUBLISHED));

            // FILTER: General Keyword (Matches Title OR Description)
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPred = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titlePred, descPred));
            }

            // FILTER: Specific Author Username
            if (author != null && !author.isBlank()) {
                Join<Post, User> authorJoin = root.join("author", JoinType.INNER);
                predicates.add(cb.equal(cb.lower(authorJoin.get("username")), author.toLowerCase()));
            }

            // FILTER: Hashtags
            if (tags != null && !tags.isEmpty()) {
                Join<Post, Hashtag> tagJoin = root.join("hashtags", JoinType.INNER);
                List<String> cleanTags = tags.stream()
                        .map(t -> t.toLowerCase().replace("#", ""))
                        .toList();
                predicates.add(tagJoin.get("name").in(cleanTags));
            }

            // FILTER: Liked by Current User
            if (Boolean.TRUE.equals(liked) && currentUserId != null) {
                Join<Post, PostLike> likesJoin = root.join("likes", JoinType.INNER);
                predicates.add(cb.equal(likesJoin.get("user").get("id"), currentUserId));
            }

            // FILTER: Authored by someone the Current User Follows
            if (Boolean.TRUE.equals(followed) && currentUserId != null) {
                // Generates: AND post.author.id IN (SELECT following_id FROM subscriptions
                // WHERE follower_id = currentUserId)
                Subquery<UUID> subquery = query.subquery(UUID.class);
                Root<Subscription> subRoot = subquery.from(Subscription.class);
                subquery.select(subRoot.join("following").get("id"))
                        .where(cb.equal(subRoot.join("follower").get("id"), currentUserId));

                predicates.add(root.get("author").get("id").in(subquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}