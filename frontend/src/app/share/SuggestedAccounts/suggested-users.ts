import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // contains UpperCasePipe
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';

// Interface for type safety
interface SuggestedUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  following: boolean;
}

@Component({
  selector: 'app-suggested-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './suggested-users.html',
  styleUrls: ['./suggested-users.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestedUsersComponent implements OnInit {
  // Services
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // State
  suggestedUsers = signal<SuggestedUser[]>([]);
  currentUserId = signal<string | null>(null);

  ngOnInit(): void {
    // Set initial User ID
    this.currentUserId.set(this.tokenService.getUUID());
    this.loadSuggestedUsers();
  }

  loadSuggestedUsers() {
    this.userService.getSuggestedUsers().subscribe({
      next: (data) => this.suggestedUsers.set(data),
      error: (err) => console.error('Error loading suggestions', err),
    });
  }

  toggleFollow(user: SuggestedUser) {
    if (!this.currentUserId()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const action$ = user.following
      ? this.userService.unfollowUser(user.id)
      : this.userService.followUser(user.id);

    action$.subscribe({
      next: () => {
        // Immutable update of the specific user inside the array
        this.suggestedUsers.update((users) =>
          users.map((u) => (u.id === user.id ? { ...u, following: !u.following } : u))
        );
      },
      error: (err) =>
        console.error(`Error ${user.following ? 'unfollowing' : 'following'} user:`, err),
    });
  }
}
