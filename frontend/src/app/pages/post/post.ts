import { Component, inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { switchMap, tap } from 'rxjs';

// Models & Services
import { PostResponse, SinglePostResponse } from '../../models/POST/PostResponse';
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';

// Components
import { MarkdownComponent } from 'ngx-markdown';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';

// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-post-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MarkdownComponent,
    PostOptionsMenuComponent,
    SuggestedUsersComponent,
    // Material Modules
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [PostService],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class PostPage implements OnInit, OnDestroy {
  // State
  isAdmin = false;
  postToDelete: PostResponse | null = null;
  postId!: string;
  post: SinglePostResponse | null = null;

  loading = true;
  currentUserId: string | null = '';
  newComment: string = '';

  // Chunking State
  private readonly CHUNK_PAGE_SIZE = 1;
  fullContentDisplay = '';
  currentPage = 0;
  hasMoreChunks = true;
  isLoadingChunks = false;

  // Services
  postService = inject(PostService);
  tokenService = inject(TokenService);
  private router = inject(Router);
  private dialog = inject(MatDialog); // Inject MatDialog

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
          return this.postService.getPostMetadata(this.postId);
        })
      )
      .subscribe({
        next: (res) => {
          this.post = res;
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

  onReport(userId: string) {
    this.router.navigate(['/report', userId]);
  }

  // --- DELETE LOGIC (Using MatDialog) ---
  onDelete(p: PostResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this story?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.confirmDelete(p);
      }
    });
  }

  confirmDelete(p: PostResponse) {
    this.postService.deletePost(p.id).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Delete failed', err);
      },
    });
  }

  sendComment() {
    if (!this.newComment.trim() || !this.post) return;

    this.postService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        if (!this.post!.comments) this.post!.comments = [];
        this.post!.comments.push(comment);
        this.post!.commentCount++;
        this.newComment = '';
      },
      error: (err) => console.log(err),
    });
  }
}
