import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-popular-tags',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sidebar-sticky">
      <h3 class="sidebar-title">Recommended topics</h3>

      <div class="tags-wrapper">
        @for (tag of recommendedTopics(); track tag) {
        <a
          [routerLink]="['/']"
          [queryParams]="{ tag: tag }"
          class="tag-pill"
          [class.active]="currentTag() === tag"
        >
          {{ tag }}
        </a>
        }
      </div>

      <!-- Show fallback if empty -->
      @if (recommendedTopics().length === 0) {
      <p class="no-tags">No trending topics yet.</p>
      }
    </div>
  `,
  styles: [
    `
      .sidebar-sticky {
        margin-bottom: 48px;
      }
      .sidebar-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 24px;
      }
      .tags-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 24px;
      }
      .tag-pill {
        background-color: var(--secondary);
        color: var(--text-secondary);
        padding: 8px 16px;
        border-radius: 9999px;
        font-size: 13px;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .tag-pill:hover {
        background-color: var(--border);
        color: var(--text-primary);
      }
      /* Active State Styles */
      .tag-pill.active {
        background-color: var(--text-primary); /* Black/Dark */
        color: var(--background); /* White */
        border-color: var(--text-primary);
      }

      .no-tags {
        font-size: 13px;
        color: var(--text-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopularTagsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);

  // State Signals
  recommendedTopics = signal<string[]>([]);

  // FIX: Make this a signal so the UI updates when URL changes
  currentTag = signal<string | null>(null);

  ngOnInit() {
    // 1. Listen to URL changes to update active state
    this.route.queryParams.subscribe((params) => {
      // Since this is a signal, setting it triggers the OnPush view update
      this.currentTag.set(params['tag'] || null);
    });

    // 2. Fetch tags
    this.postService.getPopularTags().subscribe({
      next: (tags) => this.recommendedTopics.set(tags),
      error: (err) => console.error('Failed to load tags', err),
    });
  }
}
