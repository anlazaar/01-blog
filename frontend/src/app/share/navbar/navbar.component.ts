import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  ChangeDetectorRef,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

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
    // Material Modules
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
  // This allows us to style the Material Menu Popup (which renders outside the component)
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isMobileMenuOpen = false;
  isMobile = false;
  isAdmin = false;

  unreadCount = 0;
  notifications: Notification[] = [];

  avatarUrl: string | null = null;
  username: string | null = null;
  userId: string | null = null;

  private sseSub!: Subscription;
  private authSubscription!: Subscription;

  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.authSubscription = this.tokenService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.userId = this.tokenService.getUUID();
        this.isAdmin = this.tokenService.isAdmin();
        this.loadUserInfo();
      }
    });
    this.checkScreenSize();
  }

  loadUserInfo() {
    if (!this.userId) return;

    this.userService.getUserPublicProfile(this.userId).subscribe((res) => {
      this.avatarUrl = res.avatarUrl
        ? 'http://localhost:8080' + res.avatarUrl
        : '/default-avatar.jpg';
      this.username = res.username;

      if (!this.isAdmin) {
        this.loadNotifications();
        this.subscribeToRealTime();
      }
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe((data) => {
      this.notifications = data;
      this.updateUnreadCount();
    });
  }

  subscribeToRealTime() {
    this.sseSub = this.notificationService.getServerSentEvent().subscribe({
      next: (newNotification) => {
        this.notifications.unshift(newNotification);
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('SSE Error', err),
    });
  }

  markRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.updateUnreadCount();
      });
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
  }

  logout(): void {
    this.tokenService.clear();
    this.isLoggedIn = false;
    this.closeMobileMenu();
    this.router.navigate(['auth/login']);
  }

  /* --- Mobile Logic --- */
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
    if (!this.isMobile) this.isMobileMenuOpen = false;
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) this.authSubscription.unsubscribe();
    if (this.sseSub) this.sseSub.unsubscribe();
  }
}
