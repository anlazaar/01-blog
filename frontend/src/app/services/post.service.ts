import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PostResponse, SinglePostResponse, CommentDTO } from '../models/POST/PostResponse';
import { Page } from '../models/Page';
import { environment } from '../../environments/environment';

export interface PostChunkResponse {
  index: number;
  content: string;
  isLast: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private http = inject(HttpClient);

  // Base URLs
  private POSTS_URL = `${environment.apiUrl}/posts`;
  private LIKES_URL = `${environment.apiUrl}/likes`;
  private COMMENTS_URL = `${environment.apiUrl}/comments`;
  private REPORTS_URL = `${environment.apiUrl}/reports`;

  // --- 1. POST CREATION & EDITING ---

  initPost(formData: FormData): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.POSTS_URL}/init`, formData);
  }

  updatePost(id: string, data: any): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.POSTS_URL}/${id}`, data);
  }

  uploadChunk(postId: string, index: number, content: string): Observable<void> {
    return this.http.post<void>(`${this.POSTS_URL}/chunk`, {
      postId,
      index,
      content,
    });
  }

  publishPost(postId: string, totalChunks: number): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.POSTS_URL}/${postId}/publish`, null, {
      params: { totalChunks: totalChunks.toString() },
    });
  }

  uploadEditorMedia(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.POSTS_URL}/media/upload`, formData);
  }

  clearPostContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.POSTS_URL}/${id}/content`);
  }

  deletePost(id: string) {
    return this.http.delete(`${this.POSTS_URL}/${id}`);
  }

  // --- 2. RETRIEVAL & FEED ---

  getPostMetadata(id: string): Observable<SinglePostResponse> {
    return this.http.get<SinglePostResponse>(`${this.POSTS_URL}/${id}`);
  }

  getAllPosts(page: number = 0, size: number = 4): Observable<Page<PostResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<PostResponse>>(this.POSTS_URL, { params });
  }

  getDrafts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.POSTS_URL}/drafts`);
  }

  getSavedPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.POSTS_URL}/saved`);
  }

  getPostsByTag(tag: string, page: number, size: number): Observable<Page<PostResponse>> {
    // Ensure clean tag for URL
    const cleanTag = tag.replace('#', '');
    return this.http.get<Page<PostResponse>>(
      `${this.POSTS_URL}/tag/${cleanTag}?page=${page}&size=${size}`
    );
  }

  // --- 3. CONTENT LOADING ---

  getPostContentChunks(
    postId: string,
    page: number,
    size: number
  ): Observable<PostChunkResponse[]> {
    return this.http.get<PostChunkResponse[]>(
      `${this.POSTS_URL}/${postId}/content?page=${page}&size=${size}`
    );
  }

  // Helper: Combines chunks into one string
  getFullPostContent(id: string): Observable<string> {
    return this.getPostContentChunks(id, 0, 100).pipe(
      map((chunks) => chunks.map((c) => c.content).join(''))
    );
  }

  // --- 4. INTERACTION (Likes, Comments, Reports) ---

  likePost(id: string) {
    return this.http.post(`${this.LIKES_URL}/${id}/like`, {});
  }

  unlikePost(id: string) {
    return this.http.post(`${this.LIKES_URL}/${id}/unlike`, {});
  }

  toggleSavePost(id: string): Observable<{ isSaved: boolean }> {
    return this.http.post<{ isSaved: boolean }>(`${this.POSTS_URL}/${id}/save`, {});
  }

  createComment(postId: string, text: string): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(`${this.COMMENTS_URL}/post/${postId}`, {
      text,
    });
  }

  reportUser(reason: string, userId: string) {
    return this.http.post(`${this.REPORTS_URL}`, {
      reportedUserId: userId,
      reason: reason,
    });
  }

  // --- 5. HASHTAGS ---

  getPopularTags(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/hashtags/popular?limit=10`);
  }

  searchTags(query: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/hashtags/search?query=${query}`);
  }
}
