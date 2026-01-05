import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  effect,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // DatePipe, UpperCasePipe
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

// Models & Services
import { PostResponse, SinglePostResponse } from '../../models/POST/PostResponse';
import { TokenService } from '../../services/token.service';

// Components
import { MarkdownComponent } from 'ngx-markdown';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';

// Material
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostService } from '../../services/post.service';
import { PopularTagsComponent } from "../../share/popular-tags/popular-tags";

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
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PopularTagsComponent
],
  providers: [PostService],
  templateUrl: './post.html',
  styleUrl: './post.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostPage implements OnInit, OnDestroy {
  // --- INJECTIONS ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private dialog = inject(MatDialog);

  // --- STATE SIGNALS ---
  post = signal<SinglePostResponse | null>(null);
  loading = signal(true);

  // User Context
  isAdmin = signal(false);
  currentUserId = signal<string | null>(null);

  // Content Chunking
  fullContentDisplay = signal('');
  isLoadingChunks = signal(false);
  hasMoreChunks = signal(true);
  private currentPage = 0;
  private readonly CHUNK_PAGE_SIZE = 1;

  // Comments
  newComment = signal('');

  // Intersection Observer
  private observer: IntersectionObserver | null = null;
  @ViewChild('scrollAnchor') scrollAnchorRef!: ElementRef;

  ngOnInit(): void {
    // User Init
    this.currentUserId.set(this.tokenService.getUUID());
    this.isAdmin.set(this.tokenService.isAdmin());

    // Route Subscription
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id')!;
          this.resetState(); // Reset signals when ID changes
          return this.postService.getPostMetadata(id);
        })
      )
      .subscribe({
        next: (res) => {
          // Ensure comments array exists
          const data = { ...res, comments: res.comments || [] };
          console.log(data);
          this.post.set(data);
          this.loading.set(false);

          // Start loading content
          // We use setTimeout to let the DOM render the scroll anchor first
          setTimeout(() => this.initObserver(), 0);
          this.loadNextChunk(res.id);
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

  // --- SCROLL OBSERVER ---
  private initObserver() {
    if (this.observer) this.disconnectObserver();
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

          // Append content
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

  // --- ACTIONS ---

  toggleLike(postObj: SinglePostResponse) {
    // Optimistic Update
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
        // Revert on error
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
        // Immutable update to comments array
        this.post.update((current) => {
          if (!current) return null;
          return {
            ...current,
            comments: [...current.comments, comment],
            commentCount: current.commentCount + 1, // Assuming there's a count property, or derived from length
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
