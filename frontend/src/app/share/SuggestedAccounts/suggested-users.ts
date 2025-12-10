import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-suggested-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './suggested-users.html',
  styleUrls: ['./suggested-users.css'],
})
export class SuggestedUsersComponent implements OnInit {
  suggestedUsers: any[] = [];
  currentUserId: string | null = null;

  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUUID();
    this.loadSuggestedUsers();
  }

  loadSuggestedUsers() {
    this.userService.getSuggestedUsers().subscribe({
      next: (data) => {
        this.suggestedUsers = data;
      },
      error: (err) => console.error('Error loading suggestions', err),
    });
  }

  toggleFollow(user: any) {
    if (!this.currentUserId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (user.following) {
      this.userService.unfollowUser(user.id).subscribe({
        next: () => {
          user.following = false;
        },
        error: (err) => console.error('ERROR UNFOLLOWING USER :', err),
      });
    } else {
      this.userService.followUser(user.id).subscribe({
        next: () => {
          user.following = true;
        },
        error: (err) => console.error('ERROR FOLLOWING USER :', err),
      });
    }
  }
}
