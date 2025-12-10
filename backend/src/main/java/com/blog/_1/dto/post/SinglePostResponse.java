package com.blog._1.dto.post;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.ArrayList;
import java.util.List;

import com.blog._1.dto.comment.CommentDTO;

@Data
@EqualsAndHashCode(callSuper = true)
public class SinglePostResponse extends PostResponse {
    private List<CommentDTO> comments = new ArrayList<>();
}