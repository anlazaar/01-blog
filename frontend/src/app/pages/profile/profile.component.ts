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
import { PostService } from '../../services/post.service';
import { TokenService } from '../../services/token.service';
import { UserPublicProfileDTO } from '../../models/USER/UserPublicProfileDTO';
import { PostResponse } from '../../models/POST/PostResponse';

// Components
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';

// Angular Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PostOptionsMenuComponent,
    MatDialogModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  // --- INJECTIONS ---
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private tokenService = inject(TokenService);
  private dialog = inject(MatDialog);

  // --- STATE SIGNALS ---
  user = signal<UserPublicProfileDTO | null>(null);
  loading = signal(true);


  isAdmin = this.tokenService.isAdminSignal;
  private currentUserId = this.tokenService.userId;


  isCurrentUser = computed(() => {
    const u = this.user();
    const myId = this.currentUserId();
    return u && myId ? u.id === myId : false;
  });

  private readonly BACKEND_URL = environment.serverUrl;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => this.loading.set(true)),
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
          console.log(data  );
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

  onArchive(post: PostResponse) {
    this.postService.archivePost(post.id).subscribe({
      next: () => {
        this.updatePostInList(post.id, { postStatus: 'ARCHIVED' });
      },
      error: (err) => console.error(err),
    });
  }

  onUnarchive(post: PostResponse) {
    this.postService.unarchivePost(post.id).subscribe({
      next: () => {
        this.updatePostInList(post.id, { postStatus: 'PUBLISHED' });
      },
      error: (err) => console.error(err),
    });
  }

  onDelete(p: PostResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this story forever?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.confirmDelete(p.id);
      }
    });
  }

  private confirmDelete(postId: string) {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.user.update((u) =>
          u ? { ...u, posts: u.posts.filter((p) => p.id !== postId) } : null
        );
      },
      error: (err) => console.error('Delete failed:', err),
    });
  }

  onReport(postId: string) {
    // Navigate to report page
  }

  private updatePostInList(postId: string, changes: Partial<PostResponse>) {
    this.user.update((u) => {
      if (!u) return null;
      return {
        ...u,
        posts: u.posts.map((p) => (p.id === postId ? { ...p, ...changes } : p)),
      };
    });
  }
}
