import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap, tap } from 'rxjs/operators';

// Models & Services
import { UserService } from '../../services/UserService';
import { TokenService } from '../../services/token.service';
import { UserPublicProfileDTO } from '../../models/USER/UserPublicProfileDTO';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './profile.component.html',
  styleUrls: ['profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  // --- INJECTIONS ---
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);

  // --- STATE SIGNALS ---
  user = signal<UserPublicProfileDTO | null>(null);
  loading = signal(true);

  // Directly access TokenService signals
  isAdmin = this.tokenService.isAdminSignal;
  private currentUserId = this.tokenService.userId;

  // --- COMPUTED VALUES ---
  // Automatically checks if the loaded user ID matches the logged-in ID
  isCurrentUser = computed(() => {
    const u = this.user();
    const myId = this.currentUserId();
    return u && myId ? u.id === myId : false;
  });

  private readonly BACKEND_URL = environment.serverUrl;

  ngOnInit(): void {
    // Reactively fetch user data when Route Param ID changes
    this.route.paramMap
      .pipe(
        tap(() => this.loading.set(true)), // Show spinner immediately on nav
        switchMap((params) => {
          const id = params.get('id');
          if (!id) throw new Error('No ID provided');
          return this.userService.getUserPublicProfile(id);
        })
      )
      .subscribe({
        next: (data) => {
          // Normalize Avatar URL immediately
          if (data.avatarUrl && !data.avatarUrl.startsWith('http')) {
            data.avatarUrl = this.BACKEND_URL + data.avatarUrl;
          }
          this.user.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading profile', err);
          this.loading.set(false);
        },
      });
  }

  toggleFollow() {
    const currentUser = this.user();
    if (!currentUser) return;

    // 1. Calculate new state (Optimistic)
    const wasFollowing = currentUser.following;
    const newFollowingStatus = !wasFollowing;
    const newCount = wasFollowing ? currentUser.followersCount - 1 : currentUser.followersCount + 1;

    // 2. Update UI Immediately
    this.user.update((u) =>
      u ? { ...u, following: newFollowingStatus, followersCount: newCount } : null
    );

    // 3. Perform API Request
    const action$ = wasFollowing
      ? this.userService.unfollowUser(currentUser.id)
      : this.userService.followUser(currentUser.id);

    action$.subscribe({
      error: (err) => {
        console.error('Follow action failed', err);
        // 4. Revert on Error
        this.user.update((u) =>
          u ? { ...u, following: wasFollowing, followersCount: currentUser.followersCount } : null
        );
      },
    });
  }
}
