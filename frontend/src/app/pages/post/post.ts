import { Component, inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
// UPDATED IMPORTS
import { PostResponse, SinglePostResponse } from '../../models/POST/PostResponse';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { switchMap, tap } from 'rxjs';
import { PostService } from '../../services/post.service';
import {
  faHeart as faHeartRegular,
  faComment as faCommentRegular,
} from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { TokenService } from '../../services/token.service';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { FormsModule } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';

@Component({
  selector: 'app-post-page',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    PostOptionsMenuComponent,
    ConfirmDialogComponent,
    FormsModule,
    RouterLink,
    MarkdownComponent,
    SuggestedUsersComponent,
  ],
  providers: [PostService],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class PostPage implements OnInit, OnDestroy {
  // Icons
  faHeartRegular = faHeartRegular;
  faHeartSolid = faHeartSolid;
  faCommentRegular = faCommentRegular;

  // State
  isAdmin = false;
  showConfirm = false;
  postToDelete: PostResponse | null = null;

  postId!: string;

  // UPDATED: This must be SinglePostResponse to access 'comments'
  post: SinglePostResponse | null = null;

  loading = true;
  currentUserId: string | null = '';
  newComment: string = '';

  // Chunking State
  private readonly CHUNK_PAGE_SIZE = 2;
  fullContentDisplay = '';
  currentPage = 0;
  hasMoreChunks = true;
  isLoadingChunks = false;

  // Services
  postService = inject(PostService);
  tokenService = inject(TokenService);

  private observer: IntersectionObserver | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  // --- OBSERVER SETUP ---
  @ViewChild('scrollAnchor') set scrollAnchor(element: ElementRef) {
    if (element && !this.observer) {
      this.setupObserver(element.nativeElement);
    }
  }

  private setupObserver(target: HTMLElement) {
    const options = { root: null, rootMargin: '200px', threshold: 0.1 };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && this.hasMoreChunks && !this.isLoadingChunks) {
          this.loadNextChunk();
        }
      });
    }, options);

    this.observer.observe(target);
  }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUUID();
    this.isAdmin = this.tokenService.isAdmin();

    this.route.paramMap
      .pipe(
        tap(() => this.resetState()),
        switchMap((params) => {
          this.postId = params.get('id')!;
          // Returns SinglePostResponse now
          return this.postService.getPostMetadata(this.postId);
        })
      )
      .subscribe({
        next: (res) => {
          this.post = res;

          // Defensive Check: Ensure comments array exists
          if (!this.post.comments) {
            this.post.comments = [];
          }

          this.loading = false;
          this.loadNextChunk();
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
        },
      });
  }

  private resetState() {
    this.loading = true;
    this.post = null;
    this.fullContentDisplay = '';
    this.currentPage = 0;
    this.hasMoreChunks = true;
    this.isLoadingChunks = false;
    this.newComment = '';
    this.disconnectObserver();
  }

  loadNextChunk() {
    if (!this.hasMoreChunks || this.isLoadingChunks) return;

    this.isLoadingChunks = true;

    this.postService
      .getPostContentChunks(this.postId, this.currentPage, this.CHUNK_PAGE_SIZE)
      .subscribe({
        next: (chunks) => {
          this.isLoadingChunks = false;

          if (!chunks || chunks.length === 0) {
            this.hasMoreChunks = false;
            this.disconnectObserver();
            return;
          }

          chunks.forEach((chunk) => {
            this.fullContentDisplay += chunk.content;
            if (chunk.isLast) {
              this.hasMoreChunks = false;
              this.disconnectObserver();
            }
          });

          this.currentPage++;
        },
        error: (err) => {
          console.error('Failed to load chunk', err);
          this.isLoadingChunks = false;
        },
      });
  }

  toggleLike(post: PostResponse) {
    if (post.likedByCurrentUser) {
      this.postService.unlikePost(post.id).subscribe(() => {
        post.likedByCurrentUser = false;
        post.likeCount--;
      });
    } else {
      this.postService.likePost(post.id).subscribe(() => {
        post.likedByCurrentUser = true;
        post.likeCount++;
      });
    }
  }

  ngOnDestroy() {
    this.disconnectObserver();
  }

  private disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // --- Other Methods ---
  onUpdate(post: PostResponse) {}

  onDelete(p: PostResponse) {
    this.postToDelete = p;
    this.showConfirm = true;
  }

  confirmDelete() {
    if (this.postToDelete) {
      this.postService.deletePost(this.postToDelete.id).subscribe(() => {
        this.showConfirm = false;
      });
    }
  }

  cancelDelete() {
    this.showConfirm = false;
    this.postToDelete = null;
  }

  sendComment() {
    if (!this.newComment.trim() || !this.post) return;

    this.postService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        // Now valid because this.post is SinglePostResponse
        if (!this.post!.comments) this.post!.comments = [];

        this.post!.comments.push(comment);
        this.post!.commentCount++; // Keep UI sync

        this.newComment = '';
      },
      error: (err) => console.log(err),
    });
  }
}
