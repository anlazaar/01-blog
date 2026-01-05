import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Services
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Define Interface for better type safety
interface UserProfile {
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimized rendering
})
export class UsersPageComponent implements OnInit {
  // --- INJECTIONS ---
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // --- STATE SIGNALS ---
  users = signal<UserProfile[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  isLastPage = signal(false);
  currentUserId = signal<string | null>(null);

  // Constants & Internal State
  readonly skeletonItems = new Array(8);
  private currentPage = 0;
  private readonly pageSize = 8;

  ngOnInit(): void {
    this.currentUserId.set(this.tokenService.getUUID());
    this.loadUsers();
  }

  loadUsers() {
    // Determine loading state based on if it's the first page
    if (this.currentPage === 0) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        // Filter out current user from the results
        const newUsers = data.content.filter((u: any) => u.id !== this.currentUserId());

        if (this.currentPage === 0) {
          this.users.set(newUsers);
        } else {
          // Immutable append: [...old, ...new]
          this.users.update((current) => [...current, ...newUsers]);
        }

        // Check if last page
        const isLast = data.page.number === data.page.totalPages - 1 || data.page.totalPages === 0;
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
    if (!this.currentUserId()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // 1. Optimistic UI Update
    this.updateFollowState(user.id, !user.following);

    // 2. API Call
    const action$ = user.following
      ? this.userService.unfollowUser(user.id)
      : this.userService.followUser(user.id);

    action$.subscribe({
      error: () => {
        // 3. Revert on Error
        this.updateFollowState(user.id, user.following);
      },
    });
  }

  // Helper method for immutable updates inside the array signal
  private updateFollowState(userId: string, newStatus: boolean) {
    this.users.update((list) =>
      list.map((u) => (u.id === userId ? { ...u, following: newStatus } : u))
    );
  }
}
