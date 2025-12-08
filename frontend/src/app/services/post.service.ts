import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PostResponse } from '../models/global.model';

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface PostChunkResponse {
  index: number;
  content: string;
  isLast: boolean;
}

export interface PostChunk {
  index: number;
  content: string;
  isLast: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private API_URL = 'http://localhost:8080/api/posts';

  constructor(private http: HttpClient) {}

  // 1. Init Post
  initPost(formData: FormData): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.API_URL}/init`, formData);
  }

  updatePost(id: string, data: any): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.API_URL}/${id}`, data);
  }

  // 2. Upload One Chunk
  uploadChunk(postId: string, index: number, content: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/chunk`, {
      postId,
      index,
      content,
    });
  }

  // 3. Finalize
  publishPost(postId: string, totalChunks: number): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.API_URL}/${postId}/publish`, null, {
      params: { totalChunks: totalChunks.toString() },
    });
  }

  // 2. Get Metadata Only
  getPostMetadata(id: string) {
    return this.http.get<PostResponse>(`${this.API_URL}/${id}`);
  }

  // 3. Lazy Load Chunks
  getPostContentChunks(
    postId: string,
    page: number,
    size: number
  ): Observable<PostChunkResponse[]> {
    // Explicitly sending page and size params
    return this.http.get<PostChunkResponse[]>(
      `${this.API_URL}/${postId}/content?page=${page}&size=${size}`
    );
  }

  getPostById(id: string) {
    return this.http.get<PostResponse>(this.API_URL + '/' + id);
  }

  getAllPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(this.API_URL);
  }

  likePost(id: string) {
    return this.http.post(`http://localhost:8080/api/likes/${id}/like`, {});
  }

  unlikePost(id: string) {
    return this.http.post(`http://localhost:8080/api/likes/${id}/unlike`, {});
  }

  createComment(postId: string, text: string) {
    return this.http.post<any>(`http://localhost:8080/api/comments/post/${postId}`, { text });
  }

  deletePost(id: string) {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  reportUser(reason: string, userId: string) {
    return this.http.post(`http://localhost:8080/api/reports`, {
      reportedUserId: userId,
      reason: reason,
    });
  }

  // post.service.ts
  uploadEditorMedia(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    // Matches the Backend Controller: @PostMapping("/media/upload")
    return this.http.post<{ url: string }>(`${this.API_URL}/media/upload`, formData);
  }

  getDrafts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.API_URL}/drafts`);
  }

  // Used before re-uploading chunks in edit mode
  clearPostContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}/content`);
  }

  // Helper to fetch full content (all chunks) as string for the editor
  getFullPostContent(id: string): Observable<string> {
    // For simplicity here, assuming 100 chunk max, should cover most posts but not spam XD.
    return this.getPostContentChunks(id, 0, 100).pipe(
      map((chunks) => chunks.map((c) => c.content).join(''))
    );
  }
}
