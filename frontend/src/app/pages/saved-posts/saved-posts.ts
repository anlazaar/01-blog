import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostResponse } from '../../models/POST/PostResponse';
@Component({
  selector: 'app-saved-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h1>Your Library</h1>

      @if (loading) {
      <p>Loading...</p>
      } @else { @if (posts.length === 0) {
      <div class="empty-state">
        <p>You haven't saved any stories yet.</p>
        <a routerLink="/" class="go-home">Read stories</a>
      </div>
      } @else {
      <!-- Reuse your post card HTML here or extract it to a component -->
      <div class="posts-list">
        @for (p of posts; track p.id) {
        <article class="saved-item">
          <div class="saved-content">
            <a [routerLink]="['/posts', p.id]"
              ><h3>{{ p.title }}</h3></a
            >
            <p>{{ p.description }}</p>
            <div class="saved-meta">
              <span>{{ p.author.username }}</span> ·
              <span>{{ p.createdAt | date : 'MMM d' }}</span>
            </div>
          </div>
          <!-- Unsave Button -->
          <button (click)="unsave(p.id)" class="unsave-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </article>
        }
      </div>
      } }
    </div>
  `,
  styles: [
    `
      .page-container {
        max-width: 680px;
        margin: 100px auto;
        padding: 0 24px;
      }
      h1 {
        font-size: 42px;
        margin-bottom: 40px;
        font-family: -apple-system, sans-serif;
      }
      .saved-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 24px 0;
        border-bottom: 1px solid var(--border);
      }
      .saved-content h3 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
      }
      .saved-content p {
        color: var(--text-secondary);
        font-family: 'Charter', serif;
        margin-bottom: 8px;
      }
      .saved-meta {
        font-size: 13px;
        color: var(--text-muted);
      }
      .unsave-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-primary);
      }
      .empty-state {
        text-align: center;
        margin-top: 60px;
        color: var(--text-secondary);
      }
      .go-home {
        color: var(--text-primary);
        text-decoration: underline;
      }
    `,
  ],
})
export class SavedPostsComponent implements OnInit {
  posts: PostResponse[] = [];
  loading = true;
  private postService = inject(PostService);

  ngOnInit() {
    this.postService.getSavedPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  unsave(id: string) {
    this.postService.toggleSavePost(id).subscribe(() => {
      // Remove from list immediately
      this.posts = this.posts.filter((p) => p.id !== id);
    });
  }
}
