import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { PostResponse } from '../../models/global.model';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { UserService } from '../../services/UserService';

@Component({
  selector: 'app-home',
  standalone: true,
  // Removed AddPost from here
  imports: [CommonModule, PostOptionsMenuComponent, ConfirmDialogComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  posts: PostResponse[] = [];
  loading = false;
  isAdmin = false;
  token: string | null = '';
  currentUserId: string | null = '';
  suggestedUsers: any[] = []; // New Array

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
    if (!this.isAdmin) {
      this.loadSuggestedUsers();
    }
  }

  toggleFollow(user: any) {
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.following) {
      this.userService.unfollowUser(user.id).subscribe({
        next: (res) => {
          user.following = false;
          console.log('Unfollowed ' + user.username);
        },
        error: (err) => {
          console.error('ERROR UNFOLLOWING USER :', err);
        },
      });
    } else {
      this.userService.followUser(user.id).subscribe({
        next: (res) => {
          user.following = true;
          console.log('Followed ' + user.username);
        },
        error: (err) => {
          console.error('ERROR FOLLOWING USER :', err);
        },
      });
    }
  }

  loadSuggestedUsers() {
    this.userService.getSuggestedUsers().subscribe({
      next: (data) => {
        this.suggestedUsers = data;
      },
    });
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
