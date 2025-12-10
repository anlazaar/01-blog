import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  ChangeDetectorRef,
} from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { TokenService } from '../../services/token.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/UserService';
import { Notification, NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, ThemeToggleComponent, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isMobileMenuOpen = false;
  isMobile = false;
  isNotificationOpen = false;
  isAdmin = false;

  unreadCount = 0;

  avatarUrl: string | null = null;
  username: string | null = null;
  userId: string | null = null;
  notifications: Notification[] = [];

  private sseSub!: Subscription;

  private notificationService = inject(NotificationService);

  private router = inject(Router);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  private authSubscription!: Subscription;

  ngOnInit(): void {
    this.authSubscription = this.tokenService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;

      if (isAuthenticated) {
        this.userId = this.tokenService.getUUID();
        this.isAdmin = this.tokenService.isAdmin();

        if (this.userId) {
          this.userService.getUserPublicProfile(this.userId).subscribe((res) => {
            this.avatarUrl = res.avatarUrl
              ? 'http://localhost:8080' + res.avatarUrl
              : '/default.jpg';
            this.username = res.username;
            if (!this.isAdmin) {
              this.loadNotifications();
              this.subscribeToRealTime();
            }
          });
        } else {
          this.avatarUrl = null;
        }
      }
    });
    this.checkScreenSize();
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
        console.log('Real-time notification received:', newNotification);
        this.notifications.unshift(newNotification);
        this.updateUnreadCount();
        this.cdr.detectChanges();
        // Optional: Play sound or show toast here
      },
      error: (err) => console.error('SSE Error', err),
    });
  }

  toggleNotifications() {
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  markRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.updateUnreadCount();
      });
    }
    // Navigate to post if needed: this.router.navigate(['/post', notification.post.id]);
    this.isNotificationOpen = false;
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.read).length;
  }

  // Cleanup
  ngOnDestroy(): void {
    if (this.authSubscription) this.authSubscription.unsubscribe();
    if (this.sseSub) this.sseSub.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
    if (!this.isMobile) {
      this.isMobileMenuOpen = false;
    }
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

  logout(): void {
    this.tokenService.clear();
    this.isLoggedIn = false;
    this.closeMobileMenu();
    this.router.navigate(['auth/login']);
  }
  
}
