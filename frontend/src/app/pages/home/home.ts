import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { PostResponse } from '../../models/global.model';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { UserService } from '../../services/UserService';
import { SuggestedUsersComponent } from '../../share/SuggestedAccounts/suggested-users';

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

  showConfirm = false;
  postToDelete: PostResponse | null = null;

  // Dependency Injection
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.token = this.tokenService.getToken();
    this.isAdmin = this.tokenService.isAdmin();
    this.currentUserId = this.tokenService.getUUID();
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
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
