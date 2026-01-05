package com.blog._1.services;

import com.blog._1.models.PostStatus;
import com.blog._1.repositories.HashtagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HashtagService {

    private final HashtagRepository hashtagRepository;

    @Transactional(readOnly = true)
    public List<String> getPopularTags(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return hashtagRepository.findTopHashtags(PostStatus.PUBLISHED, pageable);
    }

    @Transactional(readOnly = true)
    public List<String> searchTags(String query) {
        return hashtagRepository.searchByName(query, PageRequest.of(0, 5));
    }
}