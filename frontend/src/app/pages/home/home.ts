import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // DatePipe, UpperCasePipe
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// Services & Models
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { PostResponse } from '../../models/POST/PostResponse';
import { Page } from '../../models/Page';

// Components
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';
import { PopularTagsComponent } from '../../share/popular-tags/popular-tags';

// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PostOptionsMenuComponent,
    SuggestedUsersComponent,
    PopularTagsComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  // --- INJECTIONS ---
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  // --- 1. STATE SIGNALS ---
  posts = signal<PostResponse[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMorePosts = signal(true);

  // Filter state
  selectedTag = signal<string | null>(null);

  // --- 2. COMPUTED / DERIVED STATE ---
  // We reference TokenService signals directly for reactivity
  isAdmin = this.tokenService.isAdminSignal;
  currentUserId = this.tokenService.userId;

  // Constants
  readonly skeletonItems = new Array(5);
  private currentPage = 0;
  private readonly pageSize = 4;

  ngOnInit(): void {
    // Listen to Query Params (e.g., ?tag=Java)
    this.route.queryParams.subscribe((params) => {
      const tag = params['tag'];
      this.resetFeed(tag);
    });
  }

  private resetFeed(tag: string | undefined) {
    this.posts.set([]);
    this.currentPage = 0;
    this.hasMorePosts.set(true);
    this.loading.set(true);

    if (tag) {
      this.selectedTag.set(tag);
      this.loadPostsByTag(tag);
    } else {
      this.selectedTag.set(null);
      this.loadAllPosts();
    }
  }

  // --- DATA LOADING ---

  private loadPostsByTag(tag: string) {
    this.postService.getPostsByTag(tag, this.currentPage, this.pageSize).subscribe({
      next: (data) => this.handleResponse(data),
      error: (err) => this.handleError(err),
    });
  }

  private loadAllPosts() {
    this.postService.getAllPosts(this.currentPage, this.pageSize).subscribe({
      next: (data) => this.handleResponse(data),
      error: (err) => this.handleError(err),
    });
  }

  private handleResponse(data: Page<PostResponse>) {
    if (this.currentPage === 0) {
      this.posts.set(data.content);
    } else {
      this.posts.update((current) => [...current, ...data.content]);
    }

    this.hasMorePosts.set(data.page.number < data.page.totalPages - 1);
    this.loading.set(false);
    this.loadingMore.set(false);
  }

  private handleError(err: any) {
    console.error(err);
    this.loading.set(false);
    this.loadingMore.set(false);
  }

  // --- ACTIONS ---

  loadMore() {
    if (this.loadingMore() || !this.hasMorePosts()) return;

    this.loadingMore.set(true);
    this.currentPage++;

    const tag = this.selectedTag();
    if (tag) {
      this.loadPostsByTag(tag);
    } else {
      this.loadAllPosts();
    }
  }

  toggleSave(event: Event, post: PostResponse) {
    event.stopPropagation();

    // 1. Optimistic UI Update
    const newState = !post.savedByCurrentUser;
    this.updatePostInList(post.id, { savedByCurrentUser: newState });

    // 2. API Call
    this.postService.toggleSavePost(post.id).subscribe({
      next: (res) => {
        // Confirm server state matches
        if (res.isSaved !== newState) {
          this.updatePostInList(post.id, { savedByCurrentUser: res.isSaved });
        }
      },
      error: () => {
        // 3. Rollback on error
        this.updatePostInList(post.id, { savedByCurrentUser: !newState });
      },
    });
  }

  clearFilter() {
    this.router.navigate(['/']);
  }

  onReport(userId: string) {
    this.router.navigate(['/report', userId]); // Assuming route is /report/:userId
  }

  onDelete(p: PostResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this story forever?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.confirmDelete(p.id);
      }
    });
  }

  private confirmDelete(postId: string) {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        // Immutable removal
        this.posts.update((current) => current.filter((p) => p.id !== postId));
      },
      error: (err) => console.error('Delete failed:', err),
    });
  }

  // Helper for immutable updates
  private updatePostInList(postId: string, changes: Partial<PostResponse>) {
    this.posts.update((current) =>
      current.map((p) => (p.id === postId ? { ...p, ...changes } : p))
    );
  }
}
