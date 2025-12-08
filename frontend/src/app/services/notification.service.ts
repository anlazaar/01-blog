import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
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
  private baseUrl = 'http://localhost:8080/api/notifications';

  constructor(
    private http: HttpClient,
    private _zone: NgZone,
    private tokenService: TokenService
  ) {}

  // Get historical notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  // Mark specific notification as read
  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
  }

  // Connect to SSE
  getServerSentEvent(): Observable<Notification> {
    return new Observable((observer) => {
      // Pass token in query param because EventSource doesn't support headers
      const token = this.tokenService.getToken();
      const eventSource = new EventSource(`${this.baseUrl}/subscribe?token=${token}`);

      // Debug: Confirm connection
      eventSource.onopen = () => console.log('SSE Connection Opened');

      // === FIX IS HERE ===
      // Your backend uses .name("notification"), so we MUST use addEventListener
      eventSource.addEventListener('notification', (event: any) => {
        console.log('Real-time event received:', event.data); // Log raw data

        this._zone.run(() => {
          try {
            const data = JSON.parse(event.data);
            observer.next(data);
          } catch (e) {
            console.error('Error parsing SSE JSON:', e);
          }
        });
      });

      // Handle errors gracefully
      eventSource.onerror = (error) => {
        // If the connection was closed normally (e.g. page refresh), ignore the error
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE Connection closed');
        } else {
          console.error('SSE Error:', error);
          this._zone.run(() => {
            observer.error(error);
          });
        }
      };

      // Return cleanup function
      return () => {
        console.log('Closing SSE Connection');
        eventSource.close();
      };
    });
  }
}
