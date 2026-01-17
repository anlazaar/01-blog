import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop'; // Import this
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
export class PopularTagsComponent {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);

  // 1. ROUTE STATE
  // Convert Observable params to a Signal.
  // This automatically handles subscription/unsubscription.
  private queryParams = toSignal(this.route.queryParams);

  // derive the specific 'tag' string from the queryParams signal
  currentTag = computed(() => this.queryParams()?.['tag'] || null);

  // 2. DATA STATE
  // Since PostService is stateless, we hold the data here.
  recommendedTopics = signal<string[]>([]);

  constructor() {
    // 3. EFFECT
    // Trigger data loading when component is created
    effect(() => {
      this.loadTags();
    });
  }

  private loadTags() {
    // HTTP Observables complete automatically, so explicit unsubscribe isn't strictly necessary here,
    // but using first() or take(1) is good practice if logic gets complex.
    this.postService.getPopularTags().subscribe({
      next: (tags) => this.recommendedTopics.set(tags),
      error: (err) => console.error('Failed to load tags', err),
    });
  }
}
