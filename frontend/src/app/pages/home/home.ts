import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PostOptionsMenuComponent,
    SuggestedUsersComponent,
    // Material Modules
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  posts: PostResponse[] = [];
  loading = true;
  isAdmin = false;
  token: string | null = '';
  currentUserId: string | null = '';
  skeletonItems = new Array(5);

  // Pagination State
  loadingMore = false;
  currentPage = 0;
  pageSize = 4;
  hasMorePosts = true;

  // Dependency Injection
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private dialog = inject(MatDialog); // Inject Material Dialog

  ngOnInit(): void {
    this.token = this.tokenService.getToken();
    this.isAdmin = this.tokenService.isAdmin();
    this.currentUserId = this.tokenService.getUUID();

    // Reset state on init
    this.currentPage = 0;
    this.posts = [];
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    this.postService.getAllPosts(this.currentPage, this.pageSize).subscribe({
      next: (data: Page<PostResponse>) => {
        this.posts = data.content;
        this.loading = false;
        this.hasMorePosts = data.page.number < data.page.totalPages - 1;
        if (data.page.totalPages === 0) this.hasMorePosts = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  loadMore() {
    if (this.loadingMore || !this.hasMorePosts) return;

    this.loadingMore = true;
    this.currentPage++;

    this.postService.getAllPosts(this.currentPage, this.pageSize).subscribe({
      next: (data: Page<PostResponse>) => {
        this.posts = [...this.posts, ...data.content];
        this.loadingMore = false;
        this.hasMorePosts = data.page.number < data.page.totalPages - 1;
      },
      error: (err) => {
        console.error('Failed to load more posts', err);
        this.loadingMore = false;
        this.currentPage--;
      },
    });
  }

  toggleSave(event: Event, post: PostResponse) {
    event.stopPropagation();
    const originalState = post.savedByCurrentUser;
    post.savedByCurrentUser = !post.savedByCurrentUser;

    this.postService.toggleSavePost(post.id).subscribe({
      next: (res) => {
        post.savedByCurrentUser = res.isSaved;
      },
      error: () => {
        post.savedByCurrentUser = originalState;
      },
    });
  }

  onReport(id: string) {
    this.router.navigate(['/report', id]);
  }

  onUpdate(post: PostResponse) {
    // Navigate to edit page or open modal
    this.router.navigate(['/p', post.id, 'edit']);
  }

  // --- DELETE LOGIC WITH MAT DIALOG ---
  onDelete(p: PostResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this story forever?' },
      // These classes must be defined in global styles or ConfirmDialog encapsulation: None
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.confirmDelete(p.id);
      }
    });
  }

  confirmDelete(postId: string) {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter((x) => x.id !== postId);
      },
      error: (err) => console.error('Delete failed:', err),
    });
  }
}
