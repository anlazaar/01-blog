import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-page.html',
  styleUrls: ['./users-page.css'],
})
export class UsersPageComponent implements OnInit {
  users: any[] = [];
  loading = true; // Initial loading
  loadingMore = false; // "Load More" button loading state
  currentUserId: string | null = null;
  skeletonItems = new Array(8);

  // Pagination State
  currentPage = 0;
  pageSize = 8;
  isLastPage = false;

  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUUID();
    this.loadUsers(0);
  }

  loadUsers(page: number) {
    if (page === 0) this.loading = true;
    else this.loadingMore = true;

    this.userService.getAllUsers(page, this.pageSize).subscribe({
      next: (data) => {
        const newUsers = data.content.filter((u) => u.id !== this.currentUserId);

        if (page === 0) {
          this.users = newUsers;
        } else {
          this.users = [...this.users, ...newUsers];
        }

        this.isLastPage =
          data.page.number === data.page.totalPages - 1 || data.page.totalPages === 0;

        this.currentPage = page;

        this.loading = false;
        this.loadingMore = false;

        console.log('USERS DATA:', data);
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      },
    });
  }

  loadMore() {
    if (!this.isLastPage && !this.loadingMore) {
      this.loadUsers(this.currentPage + 1);
    }
  }

  toggleFollow(user: any) {
    if (!this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Optimistic UI update
    user.following = !user.following;

    if (user.following) {
      this.userService.followUser(user.id).subscribe({
        error: () => (user.following = false), // Revert on error
      });
    } else {
      this.userService.unfollowUser(user.id).subscribe({
        error: () => (user.following = true), // Revert on error
      });
    }
  }
}
