import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPublicProfileDTO } from '../models/USER/UserPublicProfileDTO';
import { UserResponse } from '../models/USER/UserResponse';
import { Page } from '../models/Page';
import { environment } from '../../environments/environment';

// Define the interface here so it can be shared with components
export interface SuggestedUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  following: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersUrl = `${environment.apiUrl}/users`;
  private subscriptionsUrl = `${environment.apiUrl}/subscriptions`;

  // --- 1. STATE MANAGEMENT (SIGNALS) ---
  // Private writable signal holds the actual data
  private _suggestedUsers = signal<SuggestedUser[]>([]);

  // Public read-only signal for components to consume
  readonly suggestedUsers = this._suggestedUsers.asReadonly();

  constructor(private http: HttpClient) {}

  // --- 2. SIGNAL-BASED ACTIONS ---

  // Loads data and updates the signal (Components just call this, they don't subscribe)
  loadSuggestedUsers(): void {
    this.getSuggestedUsers().subscribe({
      next: (data) => this._suggestedUsers.set(data),
      error: (err) => console.error('Error loading suggestions', err),
    });
  }

  // Handles optimistic UI updates + API calls
  toggleFollowState(user: SuggestedUser): void {
    const isFollowingNow = !user.following;

    // A. Optimistic Update: Update the signal IMMEDIATELY (UI updates instantly)
    this._suggestedUsers.update((users) =>
      users.map((u) => (u.id === user.id ? { ...u, following: isFollowingNow } : u))
    );

    // B. Determine which API call to make
    const action$ = isFollowingNow ? this.followUser(user.id) : this.unfollowUser(user.id);

    // C. Execute API call in background
    action$.subscribe({
      error: (err) => {
        console.error('Follow action failed', err);
        // D. Rollback: If API fails, revert the signal to previous state
        this._suggestedUsers.update((users) =>
          users.map((u) => (u.id === user.id ? { ...u, following: !isFollowingNow } : u))
        );
      },
    });
  }

  // --- 3. EXISTING API METHODS (Keep these as they were) ---

  getUserPublicProfile(id: string): Observable<UserPublicProfileDTO> {
    return this.http.get<any>(`${this.usersUrl}/${id}/block`);
  }

  getUserFullData(id: string): Observable<UserResponse> {
    return this.http.get<any>(`${this.usersUrl}/${id}`);
  }

  patchUser(req: FormData, id: String) {
    console.log('REQUEST: ', req);
    return this.http.patch<any>(`${this.usersUrl}/profile/update/${id}`, req);
  }

  // Modified to return Observable<any> to match usage above,
  // but kept public for other components if needed.
  followUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/follow`, {});
  }

  unfollowUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/unfollow`, {});
  }

  getSuggestedUsers(): Observable<SuggestedUser[]> {
    return this.http.get<SuggestedUser[]>(`${this.usersUrl}/suggested`);
  }

  getAllUsers(page: number = 0, size: number = 10): Observable<Page<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<any>>(`${this.usersUrl}/explore`, { params });
  }
}
