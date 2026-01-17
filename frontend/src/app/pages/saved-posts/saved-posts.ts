import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // DatePipe
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostResponse } from '../../models/POST/PostResponse';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-saved-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="library-header">
        <h1>Your Library</h1>
      </header>

      @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      } @else { @if (posts().length === 0) {
      <div class="empty-state">
        <mat-icon class="empty-icon">bookmark_border</mat-icon>
        <p>You haven't saved any stories yet.</p>
        <a mat-button color="primary" routerLink="/" class="go-home">Read stories</a>
      </div>
      } @else {
      <div class="posts-list">
        @for (p of posts(); track p.id) {
        <article class="saved-item">
          <div class="saved-content">
            <a [routerLink]="['/posts', p.id]" class="post-link">
              <h3>{{ p.title }}</h3>
              <p class="desc">{{ p.description }}</p>
            </a>

            <div class="saved-meta">
              <span class="author">{{ p.author.username }}</span>
              <span class="separator">·</span>
              <span class="date">{{ p.createdAt | date : 'MMM d' }}</span>
            </div>
          </div>

          <!-- Unsave Button -->
          <button
            mat-icon-button
            (click)="unsave(p)"
            matTooltip="Remove from library"
            class="unsave-btn"
          >
            <mat-icon>bookmark</mat-icon>
          </button>
        </article>
        }
      </div>
      } }
    </div>
  `,
  styles: [
    `
      /* --- Layout --- */
      .page-container {
        max-width: 680px;
        margin: 0 auto;
        padding: 100px 24px 60px 24px;
      }

      /* --- Header --- */
      .library-header {
        margin-bottom: 48px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 24px;
      }

      h1 {
        font-size: 42px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      /* --- List Items --- */
      .saved-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 24px 0;
        border-bottom: 1px solid var(--border);
        gap: 24px;
      }

      .saved-content {
        flex: 1;
        min-width: 0;
      }

      .post-link {
        text-decoration: none;
        color: inherit;
        display: block;
        margin-bottom: 8px;
      }

      .post-link:hover h3 {
        text-decoration: underline;
      }

      h3 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
        line-height: 1.2;
      }

      .desc {
        color: var(--text-secondary);
        font-family: 'Charter', 'Georgia', serif;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .saved-meta {
        font-size: 13px;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .separator {
        font-weight: bold;
      }

      /* --- Action Button --- */
      .unsave-btn {
        color: var(--text-primary) !important;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .unsave-btn:hover {
        opacity: 1;
        background-color: var(--secondary) !important;
      }

      /* --- States --- */
      .loading-state {
        display: flex;
        justify-content: center;
        padding: 60px 0;
      }

      .empty-state {
        text-align: center;
        margin-top: 80px;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-muted);
        margin-bottom: 8px;
      }

      .go-home {
        color: #1a8917 !important;
        font-weight: 400;
      }
    `,
  ],
})
export class SavedPostsComponent {
  private postService = inject(PostService);

  // State Signals
  posts = signal<PostResponse[]>([]);
  loading = signal(true);

  constructor() {
    // Declarative data loading via effect
    effect(() => {
      this.loadSavedPosts();
    });
  }

  private loadSavedPosts() {
    this.postService.getSavedPosts().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  unsave(post: PostResponse) {
    // 1. Optimistic UI update: Remove immediately
    this.posts.update((current) => current.filter((p) => p.id !== post.id));

    // 2. API Call
    this.postService.toggleSavePost(post.id).subscribe({
      error: () => {
        // 3. Rollback on Error: Add it back to top of list
        console.error('Failed to unsave');
        this.posts.update((current) => [post, ...current]);
      },
    });
  }
}
