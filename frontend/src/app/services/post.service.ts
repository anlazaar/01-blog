import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PostResponse, SinglePostResponse, CommentDTO } from '../models/POST/PostResponse';
import { Page } from '../models/Page';

export interface PostChunkResponse {
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

  // 4. Get Metadata Only (Single Post View)
  // UPDATED: Returns SinglePostResponse (includes comments)
  getPostMetadata(id: string): Observable<SinglePostResponse> {
    return this.http.get<SinglePostResponse>(`${this.API_URL}/${id}`);
  }

  // 5. Lazy Load Chunks
  getPostContentChunks(
    postId: string,
    page: number,
    size: number
  ): Observable<PostChunkResponse[]> {
    return this.http.get<PostChunkResponse[]>(
      `${this.API_URL}/${postId}/content?page=${page}&size=${size}`
    );
  }

  // 6. Get All Posts (Feed)
  // Returns Page<PostResponse> (Lightweight, no comments)
  getAllPosts(page: number = 0, size: number = 4): Observable<Page<PostResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<PostResponse>>(this.API_URL, { params });
  }

  likePost(id: string) {
    return this.http.post(`http://localhost:8080/api/likes/${id}/like`, {});
  }

  unlikePost(id: string) {
    return this.http.post(`http://localhost:8080/api/likes/${id}/unlike`, {});
  }

  // UPDATED: Returns CommentDTO so we can push it to the array
  createComment(postId: string, text: string): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(`http://localhost:8080/api/comments/post/${postId}`, {
      text,
    });
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

  uploadEditorMedia(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.API_URL}/media/upload`, formData);
  }

  getDrafts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.API_URL}/drafts`);
  }

  clearPostContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}/content`);
  }

  getFullPostContent(id: string): Observable<string> {
    return this.getPostContentChunks(id, 0, 100).pipe(
      map((chunks) => chunks.map((c) => c.content).join(''))
    );
  }

  toggleSavePost(id: string): Observable<{ isSaved: boolean }> {
    return this.http.post<{ isSaved: boolean }>(`${this.API_URL}/${id}/save`, {});
  }

  getSavedPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.API_URL}/saved`);
  }
}
