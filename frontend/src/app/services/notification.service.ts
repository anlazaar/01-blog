import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

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
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(
    private http: HttpClient,
    private _zone: NgZone,
    private tokenService: TokenService
  ) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
  }

  getServerSentEvent(): Observable<Notification> {
    return new Observable((observer) => {
      const token = this.tokenService.getToken();
      const eventSource = new EventSource(`${this.baseUrl}/subscribe?token=${token}`);

      eventSource.onopen = () => console.log('SSE Connection Opened');

      eventSource.addEventListener('notification', (event: any) => {
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
          this._zone.run(() => {
            observer.error(error);
          });
        }
      };

      return () => {
        console.log('Closing SSE Connection');
        eventSource.close();
      };
    });
  }
}
