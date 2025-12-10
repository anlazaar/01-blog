import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { PostResponse } from '../../models/POST/PostResponse';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';
import { Page } from '../../models/Page';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  // Removed AddPost from here
  imports: [
    CommonModule,
    PostOptionsMenuComponent,
    ConfirmDialogComponent,
    RouterLink,
    SuggestedUsersComponent,
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
  suggestedUsers: any[] = []; // New Array
  skeletonItems = new Array(5);

  // Pagination State
  loadingMore = false; // Loading subsequent pages
  currentPage = 0;
  pageSize = 4;
  hasMorePosts = true; // To hide 'Load More' button when done

  showConfirm = false;
  postToDelete: PostResponse | null = null;

  // Dependency Injection
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  // private userService = inject(UserService);

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
        // 1. Get the list from .content
        this.posts = data.content;
        this.loading = false;

        // 2. Check if there are more pages using the DTO metadata
        // If current page index is less than (total pages - 1), we have more.
        this.hasMorePosts = data.page.number < data.page.totalPages - 1;

        // Edge case: if totalPages is 0 (no posts at all)
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
        // 1. Append the new content
        this.posts = [...this.posts, ...data.content];
        this.loadingMore = false;

        // 2. Re-evaluate if we have more
        this.hasMorePosts = data.page.number < data.page.totalPages - 1;
      },
      error: (err) => {
        console.error('Failed to load more posts', err);
        this.loadingMore = false;
        this.currentPage--; // Revert page on error
      },
    });
  }

  toggleSave(event: Event, post: PostResponse) {
    event.stopPropagation();

    // Optimistic UI Update
    const originalState = post.savedByCurrentUser;
    post.savedByCurrentUser = !post.savedByCurrentUser;

    this.postService.toggleSavePost(post.id).subscribe({
      next: (res) => {
        post.savedByCurrentUser = res.isSaved;
      },
      error: () => {
        // Revert on error
        post.savedByCurrentUser = originalState;
      },
    });
  }

  onReport(id: string) {
    this.router.navigate(['/report', id]);
  }

  onUpdate(post: PostResponse) {
    console.log('Update Post', post.id);
  }

  onDelete(p: PostResponse) {
    this.postToDelete = p;
    this.showConfirm = true;
  }

  confirmDelete() {
    if (!this.postToDelete) return;

    this.postService.deletePost(this.postToDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((x) => x.id !== this.postToDelete?.id);
        this.showConfirm = false;
        this.postToDelete = null;
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showConfirm = false;
        this.postToDelete = null;
      },
    });
  }

  cancelDelete() {
    this.showConfirm = false;
    this.postToDelete = null;
  }
}
