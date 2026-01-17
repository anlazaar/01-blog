import {
  Component,
  HostListener,
  inject,
  DestroyRef,
  ViewEncapsulation,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Services
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { TokenService } from '../../services/token.service';
import { UserService } from '../../services/UserService';
import { Notification, NotificationService } from '../../services/notification.service';

// --- ANGULAR MATERIAL IMPORTS ---
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef); // For cleaning up SSE

  // Services
  public tokenService = inject(TokenService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  private notificationAudio = new Audio('/sound/notification.mp3');

  // --- 1. UI STATE SIGNALS ---
  isMobileMenuOpen = signal(false);
  isMobile = signal(window.innerWidth < 768);

  // Profile data is specific to this view, so we keep it local
  username = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);

  // --- 2. GLOBAL STATE (Aliased) ---
  // We do NOT create a local signal for notifications.
  // We reference the Service's signal directly. This ensures synchronization.
  notifications = this.notificationService.notifications;

  // We reference the Service's computed signal.
  unreadCount = this.notificationService.unreadCount;

  // Shortcuts for Auth signals
  isLoggedIn = this.tokenService.isAuthenticated;
  isAdmin = this.tokenService.isAdminSignal;
  userId = this.tokenService.userId;

  constructor() {
    // --- 3. EFFECTS ---
    // React to Login/Logout automatically
    effect(() => {
      const uid = this.userId();

      if (uid) {
        // User Logged In
        this.loadProfileData(uid);
      } else {
        // User Logged Out
        this.resetState();
      }
    });
  }

  // --- 4. DATA LOADING & SSE ---

  private loadProfileData(uid: string) {
    // A. Load Avatar & Username
    this.userService.getUserPublicProfile(uid).subscribe({
      next: (res) => {
        const avatar = res.avatarUrl
          ? 'http://localhost:8080' + res.avatarUrl
          : '/default-avatar.jpg';

        this.avatarUrl.set(avatar);
        this.username.set(res.username);

        // B. If user is Normal User (not Admin), Initialize Notifications
        if (!this.isAdmin()) {
          // 1. Trigger Service to fetch initial list
          this.notificationService.loadNotifications();

          // 2. Start listening for live updates
          this.subscribeToRealTimeNotifications();
        }
      },
      error: (err) => console.error('Error loading profile', err),
    });
  }

  private subscribeToRealTimeNotifications() {
    // Subscribe to the stream
    this.notificationService
      .getServerSentEvent()
      .pipe(takeUntilDestroyed(this.destroyRef)) // Auto-unsubscribe on destroy
      .subscribe({
        next: (newNotification) => {
          // 1. Push data into the Service's State
          this.notificationService.addRealTimeNotification(newNotification);

          // 2. Play Sound (UI Side Effect)
          this.playNotificationSound();
        },
        error: (err) => console.error('SSE Error', err),
      });
  }

  // --- 5. USER ACTIONS ---

  markRead(notification: Notification) {
    if (notification.read) return;

    // Delegate to Service (It handles Optimistic Updates + API)
    this.notificationService.markAsRead(notification.id);
  }

  logout(): void {
    // Clear Token (Triggers effect -> resetState)
    this.tokenService.clear();
    this.notificationService.clearState(); // Ensure old notifs are gone
    this.closeMobileMenu();
    this.router.navigate(['auth/login']);
  }

  private resetState() {
    this.username.set(null);
    this.avatarUrl.set(null);
    // Notification service state is cleared in logout()
  }

  /* --- UI Helpers --- */

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  private playNotificationSound() {
    this.notificationAudio.currentTime = 0;
    this.notificationAudio.play().catch(() => {});
  }

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (!mobile) {
      this.isMobileMenuOpen.set(false);
    }
  }
}
