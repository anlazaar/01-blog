import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

// Models & Services
import { PostResponse, SinglePostResponse } from '../../models/POST/PostResponse';
import { TokenService } from '../../services/token.service';
import { PostService } from '../../services/post.service';

// Components
import { MarkdownComponent } from 'ngx-markdown';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { PopularTagsComponent } from '../../share/popular-tags/popular-tags';

// Material
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
    PopularTagsComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [PostService],
  templateUrl: './post.html',
  styleUrl: './post.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private dialog = inject(MatDialog);

  post = signal<SinglePostResponse | null>(null);
  loading = signal(true);

  isAdmin = this.tokenService.isAdminSignal;
  currentUserId = this.tokenService.userId;

  fullContentDisplay = signal('');
  isLoadingChunks = signal(false);
  hasMoreChunks = signal(true);
  private currentPage = 0;
  private readonly CHUNK_PAGE_SIZE = 1;

  newComment = signal('');

  private observer: IntersectionObserver | null = null;
  @ViewChild('scrollAnchor') scrollAnchorRef!: ElementRef;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) throw new Error('Post ID missing');
          this.resetState();
          return this.postService.getPostMetadata(id);
        })
      )
      .subscribe({
        next: (res) => {
          const data = { ...res, comments: res.comments || [] };
          this.post.set(data);
          this.loading.set(false);

          setTimeout(() => {
            this.initObserver();
            this.loadNextChunk(res.id);
          }, 0);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  private resetState() {
    this.loading.set(true);
    this.post.set(null);
    this.fullContentDisplay.set('');
    this.currentPage = 0;
    this.hasMoreChunks.set(true);
    this.isLoadingChunks.set(false);
    this.newComment.set('');
    this.disconnectObserver();
  }

  private initObserver() {
    this.disconnectObserver();
    if (!this.scrollAnchorRef) return;

    const options = { root: null, rootMargin: '200px', threshold: 0.1 };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const p = this.post();
        if (entry.isIntersecting && this.hasMoreChunks() && !this.isLoadingChunks() && p) {
          this.loadNextChunk(p.id);
        }
      });
    }, options);

    this.observer.observe(this.scrollAnchorRef.nativeElement);
  }

  loadNextChunk(postId: string) {
    if (!this.hasMoreChunks() || this.isLoadingChunks()) return;
    this.isLoadingChunks.set(true);

    this.postService
      .getPostContentChunks(postId, this.currentPage, this.CHUNK_PAGE_SIZE)
      .subscribe({
        next: (chunks) => {
          this.isLoadingChunks.set(false);
          if (!chunks || chunks.length === 0) {
            this.hasMoreChunks.set(false);
            this.disconnectObserver();
            return;
          }

          let newContent = '';
          let isLast = false;
          chunks.forEach((chunk) => {
            newContent += chunk.content;
            if (chunk.isLast) isLast = true;
          });

          this.fullContentDisplay.update((c) => c + newContent);

          if (isLast) {
            this.hasMoreChunks.set(false);
            this.disconnectObserver();
          }
          this.currentPage++;
        },
        error: (err) => {
          console.error('Failed to load chunk', err);
          this.isLoadingChunks.set(false);
        },
      });
  }

  toggleLike(postObj: SinglePostResponse) {
    const wasLiked = postObj.likedByCurrentUser;
    const newCount = wasLiked ? postObj.likeCount - 1 : postObj.likeCount + 1;

    this.post.update((p) =>
      p ? { ...p, likedByCurrentUser: !wasLiked, likeCount: newCount } : null
    );

    const action$ = wasLiked
      ? this.postService.unlikePost(postObj.id)
      : this.postService.likePost(postObj.id);

    action$.subscribe({
      error: () => {
        this.post.update((p) =>
          p ? { ...p, likedByCurrentUser: wasLiked, likeCount: postObj.likeCount } : null
        );
      },
    });
  }

  sendComment() {
    const text = this.newComment().trim();
    const p = this.post();
    if (!text || !p) return;

    this.postService.createComment(p.id, text).subscribe({
      next: (comment) => {
        this.post.update((current) => {
          if (!current) return null;
          return {
            ...current,
            comments: [...current.comments, comment],
          };
        });
        this.newComment.set('');
      },
      error: (err) => console.error(err),
    });
  }

  onDelete(p: PostResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this story?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.postService.deletePost(p.id).subscribe({
          next: () => this.router.navigate(['/']),
          error: (err) => console.error('Delete failed', err),
        });
      }
    });
  }

  onReport(userId: string) {
    this.router.navigate(['/report', userId]);
  }

  // --- NEW: Scroll to comments section ---
  scrollToComments() {
    const commentsEl = document.getElementById('comments-section');
    if (commentsEl) {
      commentsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
}
