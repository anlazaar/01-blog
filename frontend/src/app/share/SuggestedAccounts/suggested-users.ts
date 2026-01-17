import { Component, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

// Services
import { UserService, SuggestedUser } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-suggested-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './suggested-users.html',
  styleUrls: ['./suggested-users.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestedUsersComponent {
  // Dependencies
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // 1. STATE: Users List
  suggestedUsers = this.userService.suggestedUsers;

  // 2. STATE: Current User ID (Restored for Template)
  // We point directly to the signal in TokenService
  currentUserId = this.tokenService.userId;

  constructor() {
    // 3. EFFECT: Load data on init
    effect(() => {
      this.userService.loadSuggestedUsers();
    });
  }

  // 4. ACTION
  toggleFollow(user: SuggestedUser) {
    if (!this.tokenService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.userService.toggleFollowState(user);
  }
}
