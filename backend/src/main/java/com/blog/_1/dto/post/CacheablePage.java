package com.blog._1.dto.post;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.List;

/**
 * A Jackson-friendly wrapper for caching paginated data.
 * Spring Data's PageImpl is not meant to be serialized into Redis.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CacheablePage<T> implements Serializable {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
}