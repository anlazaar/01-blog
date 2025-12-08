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
  loading = true;
  currentUserId: string | null = null;

  // Create 8 dummy items for the skeleton grid
  skeletonItems = new Array(8);

  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUUID();
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        // Filter out self
        this.users = data.filter((u) => u.id !== this.currentUserId);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleFollow(user: any) {
    if (!this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (user.following) {
      this.userService.unfollowUser(user.id).subscribe(() => (user.following = false));
    } else {
      this.userService.followUser(user.id).subscribe(() => (user.following = true));
    }
  }
}
