import { Component, inject, OnInit } from '@angular/core';
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { CommonModule } from '@angular/common';
import { AddPost } from './add-post/add-post';
import { Router, RouterLink } from '@angular/router';
import { PostResponse } from '../../models/global.model';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AddPost, RouterLink, PostOptionsMenuComponent, ConfirmDialogComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  posts: PostResponse[] = [];
  loading = false;
  isAdmin = false;
  token: string | null = '';
  currentUserId: string | null = '';
  showConfirm = false;
  postToDelete: PostResponse | null = null;
  showReport = false;
  postToReport: PostResponse | null = null;

  showAddPost = false;
  router = inject(Router);

  constructor(private postService: PostService, private tokenService: TokenService) {}

  ngOnInit(): void {
    this.token = this.tokenService.getToken();
    this.isAdmin = this.tokenService.isAdmin();
    this.currentUserId = this.tokenService.getUUID();

    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        console.log('POSTS', data);
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
      },
    });
  }

  toggleAddPost() {
    this.showAddPost = !this.showAddPost;
  }

  onReport(id: string) {
    this.router.navigate(['/report', id]);
  }

  cancelReport() {
    this.showReport = false;
    this.postToReport = null;
  }

  onUpdate(post: PostResponse) {
    console.log('Update Post', post.id);
    // this.router.navigate(['/update', post.id]);
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
