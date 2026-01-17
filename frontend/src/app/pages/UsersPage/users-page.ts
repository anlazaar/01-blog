import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Services
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Define Interface
export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  following: boolean;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './users-page.html',
  styleUrls: ['./users-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {
  // --- INJECTIONS ---
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // --- STATE SIGNALS ---
  users = signal<UserProfile[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  isLastPage = signal(false);

  // Directly access Auth Signal
  currentUserId = this.tokenService.userId;

  // Constants
  readonly skeletonItems = new Array(8);
  private currentPage = 0;
  private readonly pageSize = 8;

  constructor() {
    // Declarative Load: Trigger initial load when component is created
    effect(() => {
      this.loadUsers();
    });
  }

  loadUsers() {
    const isFirstLoad = this.currentPage === 0;

    if (isFirstLoad) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        // Filter out myself
        const myId = this.currentUserId();
        const newUsers = data.content.filter((u: any) => u.id !== myId);

        if (isFirstLoad) {
          this.users.set(newUsers);
        } else {
          // Append
          this.users.update((current) => [...current, ...newUsers]);
        }

        // Pagination Check
        const totalPages = data.page.totalPages;
        const pageNum = data.page.number;
        // Last page if current page index equals last index OR no pages
        const isLast = totalPages === 0 || pageNum >= totalPages - 1;

        this.isLastPage.set(isLast);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMore() {
    if (!this.isLastPage() && !this.loadingMore()) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  toggleFollow(user: UserProfile) {
    if (!this.tokenService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // 1. Optimistic UI Update
    const newStatus = !user.following;
    this.updateFollowState(user.id, newStatus);

    // 2. API Call
    const action$ = user.following
      ? this.userService.unfollowUser(user.id)
      : this.userService.followUser(user.id);

    action$.subscribe({
      error: () => {
        // 3. Rollback on Error
        this.updateFollowState(user.id, !newStatus);
      },
    });
  }

  // Helper for immutable updates
  private updateFollowState(userId: string, newStatus: boolean) {
    this.users.update((list) =>
      list.map((u) => (u.id === userId ? { ...u, following: newStatus } : u))
    );
  }
}
