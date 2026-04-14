import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PostService } from '../../services/post.service';
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';
import { PostResponse } from '../../models/POST/PostResponse';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  private postService = inject(PostService);
  private userService = inject(UserService);
  public tokenService = inject(TokenService);
  private destroyRef = inject(DestroyRef);

  // --- UI STATE SIGNALS ---
  activeTab = signal<'posts' | 'users'>('posts');
  loading = signal(false);
  loadingMore = signal(false);

  // --- SEARCH & FILTER SIGNALS ---
  searchQuery = signal<string>('');
  filterLiked = signal<boolean>(false);
  filterFollowed = signal<boolean>(false);

  // --- DATA SIGNALS ---
  posts = signal<PostResponse[]>([]);
  users = signal<any[]>([]);

  // --- PAGINATION ---
  page = 0;
  hasMore = signal(false);
  private readonly SIZE = 10;

  // RxJS Subject for debouncing user typing
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Listen to typing, wait 400ms, then trigger search
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resetAndSearch();
      });

    // Initial load
    this.resetAndSearch();
  }

  // Called when user types in the input
  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  // Switch tabs (Posts/Users)
  setTab(tab: 'posts' | 'users') {
    this.activeTab.set(tab);
    this.resetAndSearch();
  }

  // Toggle Filters (Posts only)
  toggleFilter(filter: 'liked' | 'followed') {
    if (filter === 'liked') this.filterLiked.set(!this.filterLiked());
    if (filter === 'followed') this.filterFollowed.set(!this.filterFollowed());
    this.resetAndSearch();
  }

  private resetAndSearch() {
    this.page = 0;
    this.posts.set([]);
    this.users.set([]);
    this.hasMore.set(false);
    this.executeSearch();
  }

  executeSearch() {
    this.loading.set(true);

    if (this.activeTab() === 'posts') {
      this.postService
        .searchPosts(
          this.searchQuery(),
          undefined, // author
          undefined, // tags array
          this.filterLiked(),
          this.filterFollowed(),
          this.page,
          this.SIZE
        )
        .subscribe({
          next: (res) => {
            if (this.page === 0) this.posts.set(res.content);
            else this.posts.update((prev) => [...prev, ...res.content]);

            this.hasMore.set(res.page.number < res.page.totalPages - 1);
            this.loading.set(false);
            this.loadingMore.set(false);
          },
          error: () => this.loading.set(false),
        });
    } else {
      this.userService.searchUsers(this.searchQuery(), this.page, this.SIZE).subscribe({
        next: (res) => {
          if (this.page === 0) this.users.set(res.content);
          else this.users.update((prev) => [...prev, ...res.content]);

          this.hasMore.set(res.page.number < res.page.totalPages - 1);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  loadMore() {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.page++;
    this.executeSearch();
  }
}
