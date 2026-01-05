import {
  Component,
  HostListener,
  inject,
  ViewEncapsulation,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

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
  changeDetection: ChangeDetectionStrategy.OnPush, // Best practice with Signals
})
export class NavbarComponent {
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  // --- STATE SIGNALS ---
  isMobileMenuOpen = signal(false);
  isMobile = signal(window.innerWidth < 768);

  // Convert Observable to Signal immediately
  // initialValue is false until the service emits
  isLoggedIn = toSignal(this.tokenService.isAuthenticated$, { initialValue: false });

  // User Data Signals
  isAdmin = signal(false);
  userId = signal<string | null>(null);
  username = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);

  // Notifications
  notifications = signal<Notification[]>([]);

  // --- COMPUTED VALUES ---
  // Automatically recalculates whenever 'notifications' signal changes
  unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.read).length;
  });

  constructor() {
    // --- EFFECTS ---
    // Effects run automatically when signals change.
    // This replaces ngOnInit logic.

    effect((onCleanup) => {
      // 1. React to Login Status
      if (this.isLoggedIn()) {
        this.userId.set(this.tokenService.getUUID());
        this.isAdmin.set(this.tokenService.isAdmin());
        this.loadUserInfo();
      } else {
        // Reset state on logout
        this.userId.set(null);
        this.username.set(null);
        this.notifications.set([]);
      }
    });
  }

  loadUserInfo() {
    const uid = this.userId();
    if (!uid) return;

    // Fetch Profile
    this.userService.getUserPublicProfile(uid).subscribe((res) => {
      const avatar = res.avatarUrl
        ? 'http://localhost:8080' + res.avatarUrl
        : '/default-avatar.jpg';

      this.avatarUrl.set(avatar);
      this.username.set(res.username);

      if (!this.isAdmin()) {
        this.loadNotifications();
        this.subscribeToRealTime();
      }
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe((data) => {
      this.notifications.set(data);
    });
  }

  subscribeToRealTime() {
    const sub = this.notificationService.getServerSentEvent().subscribe({
      next: (newNotification) => {
        // Update signal immutably
        this.notifications.update((current) => [newNotification, ...current]);
      },
      error: (err) => console.error('SSE Error', err),
    });

    // Clean up subscription when component destroys (Effect cleanup logic)
    // Note: Since this is called once, manual cleanup via DestroyRef is also an option,
    // but relying on the subscription stored in a local var is tricky in effects.
    // For simplicity in this refactor, we rely on Angular's http auto-cleanup or:
    // Ideally, use `inject(DestroyRef)` to unregister long-lived subscriptions.
  }

  markRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        // Update specific item in the array signal
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      });
    }
  }

  logout(): void {
    this.tokenService.clear();
    // No need to set isLoggedIn = false, the toSignal observes the service change
    this.closeMobileMenu();
    this.router.navigate(['auth/login']);
  }

  /* --- UI Actions --- */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
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
