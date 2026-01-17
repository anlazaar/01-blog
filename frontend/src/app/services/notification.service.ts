import { Injectable, NgZone, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO String
  post: {
    id: string;
    title: string;
    authorUsername: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private _zone = inject(NgZone);
  private tokenService = inject(TokenService);
  private baseUrl = `${environment.apiUrl}/notifications`;

  // --- 1. STATE (Single Source of Truth) ---
  private _notifications = signal<Notification[]>([]);

  // Public readonly signals
  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);

  // --- 2. HTTP ACTIONS & STATE UPDATES ---

  // Fetches from API and sets the signal
  loadNotifications(): void {
    this.http.get<Notification[]>(this.baseUrl).subscribe({
      next: (data) => this._notifications.set(data),
      error: (err) => console.error('Failed to load notifications', err),
    });
  }

  // Optimistic Update for marking read
  markAsRead(id: string): void {
    const currentList = this._notifications();

    // 1. Optimistic Update (Immediate UI change)
    this._notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

    // 2. API Call
    this.http.patch<void>(`${this.baseUrl}/${id}/read`, {}).subscribe({
      error: (err) => {
        console.error('Failed to mark read', err);
        // 3. Rollback on error
        this._notifications.set(currentList);
      },
    });
  }

  // Helper to add a single notification (used by SSE)
  addRealTimeNotification(notification: Notification) {
    this._notifications.update((current) => [notification, ...current]);
  }

  // Clears state (useful on logout)
  clearState() {
    this._notifications.set([]);
  }

  // --- 3. REAL-TIME CONNECTION (SSE) ---

  // Returns Observable stream.
  // Components should subscribe to this and call `addRealTimeNotification` inside the next callback.
  getServerSentEvent(): Observable<Notification> {
    return new Observable((observer) => {
      const token = this.tokenService.getToken();
      if (!token) {
        observer.error('No token available for SSE');
        return;
      }

      const eventSource = new EventSource(`${this.baseUrl}/subscribe?token=${token}`);

      eventSource.onopen = () => console.log('SSE Connection Opened');

      eventSource.addEventListener('notification', (event: any) => {
        // Run inside Angular Zone to ensure Change Detection works
        this._zone.run(() => {
          try {
            const data = JSON.parse(event.data);
            observer.next(data);
          } catch (e) {
            console.error('Error parsing SSE JSON:', e);
          }
        });
      });

      eventSource.onerror = (error) => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE Connection closed');
        } else {
          console.error('SSE Error:', error);
          this._zone.run(() => observer.error(error));
        }
      };

      // Cleanup when unsubscribe happens
      return () => {
        console.log('Closing SSE Connection');
        eventSource.close();
      };
    });
  }
}
