import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  WritableSignal,
} from '@angular/core';
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

// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopularTagsComponent } from '../../share/popular-tags/popular-tags';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PostOptionsMenuComponent,
    SuggestedUsersComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PopularTagsComponent,
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

  // --- STATE SIGNALS ---
  posts = signal<PostResponse[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMorePosts = signal(true);

  // User Context Signals
  isAdmin = signal(false);
  currentUserId = signal<string | null>(null);

  selectedTag = signal<string | null>(null);

  // Constants
  readonly skeletonItems = new Array(5); // For skeleton loader loop
  private currentPage = 0;
  private readonly pageSize = 4;

  ngOnInit(): void {
    this.isAdmin.set(this.tokenService.isAdmin());
    this.currentUserId.set(this.tokenService.getUUID());

    // Listen to Query Params (e.g., ?tag=Java)
    this.route.queryParams.subscribe((params) => {
      const tag = params['tag'];

      // Reset State on route change
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
    });
  }

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

    this.updatePaginationState(data);
    this.loading.set(false);
    this.loadingMore.set(false);
  }

  private handleError(err: any) {
    console.error(err);
    this.loading.set(false);
    this.loadingMore.set(false);
  }

  // Called by Load More Button
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

  private updatePaginationState(data: Page<PostResponse>) {
    const hasMore = data.page.number < data.page.totalPages - 1;
    this.hasMorePosts.set(data.page.totalPages > 0 && hasMore);
  }

  // --- ACTIONS ---

  toggleSave(event: Event, post: PostResponse) {
    event.stopPropagation();

    // Optimistic UI Update
    this.updatePostInList(post.id, { savedByCurrentUser: !post.savedByCurrentUser });

    this.postService.toggleSavePost(post.id).subscribe({
      next: (res) => {
        // Ensure state matches server response
        this.updatePostInList(post.id, { savedByCurrentUser: res.isSaved });
      },
      error: () => {
        // Revert on error
        this.updatePostInList(post.id, { savedByCurrentUser: !post.savedByCurrentUser });
      },
    });
  }

  clearFilter() {
    this.router.navigate(['/']);
  }

  onReport(id: string) {
    this.router.navigate(['/report', id]);
  }

  onUpdate(post: PostResponse) {
    this.router.navigate(['/p', post.id, 'edit']);
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
