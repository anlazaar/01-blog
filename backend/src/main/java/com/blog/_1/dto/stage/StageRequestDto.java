package com.blog._1.dto.stage;

import lombok.Data;

@Data
public class StageRequestDto {
    private String title;
    private String description;
    private boolean isPrivate;
}