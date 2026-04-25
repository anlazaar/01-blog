import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserPublicProfileDTO } from '../models/USER/UserPublicProfileDTO';
import { UserResponse } from '../models/USER/UserResponse';
import { Page } from '../models/Page';
import { environment } from '../../environments/environment';

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

  // --- 1. STATE MANAGEMENT ---

  private _suggestedUsers = signal<SuggestedUser[]>([]);
  readonly suggestedUsers = this._suggestedUsers.asReadonly();

  // ✅ ADD THIS: shared logged-in user profile state
  private _currentUserProfile = signal<UserPublicProfileDTO | null>(null);
  readonly currentUserProfile = this._currentUserProfile.asReadonly();

  private http = inject(HttpClient);

  // --- 2. CURRENT USER PROFILE ACTIONS ---

  refreshCurrentUserProfile(id: string): Observable<UserPublicProfileDTO> {
    return this.getUserPublicProfile(id).pipe(
      tap((profile) => {
        this._currentUserProfile.set(profile);
      })
    );
  }

  setCurrentUserProfile(profile: UserPublicProfileDTO | null): void {
    this._currentUserProfile.set(profile);
  }

  clearCurrentUserProfile(): void {
    this._currentUserProfile.set(null);
  }

  // --- 3. SUGGESTED USERS ACTIONS ---

  loadSuggestedUsers(): void {
    this.getSuggestedUsers().subscribe({
      next: (data) => this._suggestedUsers.set(data),
      error: (err) => console.error('Error loading suggestions', err),
    });
  }

  toggleFollowState(user: SuggestedUser): void {
    const isFollowingNow = !user.following;

    this._suggestedUsers.update((users) =>
      users.map((u) => (u.id === user.id ? { ...u, following: isFollowingNow } : u))
    );

    const action$ = isFollowingNow ? this.followUser(user.id) : this.unfollowUser(user.id);

    action$.subscribe({
      error: (err) => {
        console.error('Follow action failed', err);

        this._suggestedUsers.update((users) =>
          users.map((u) => (u.id === user.id ? { ...u, following: !isFollowingNow } : u))
        );
      },
    });
  }

  // --- 4. API METHODS ---

  getUserPublicProfile(id: string): Observable<UserPublicProfileDTO> {
    return this.http.get<UserPublicProfileDTO>(`${this.usersUrl}/${id}/block`);
  }

  getUserFullData(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.usersUrl}/${id}`);
  }

  patchUser(req: FormData, id: string): Observable<UserPublicProfileDTO> {
    return this.http.patch<UserPublicProfileDTO>(`${this.usersUrl}/profile/update/${id}`, req).pipe(
      tap((updatedProfile) => {
        this._currentUserProfile.set(updatedProfile);
      })
    );
  }

  followUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/follow`, {});
  }

  unfollowUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/unfollow`, {});
  }

  getSuggestedUsers(): Observable<SuggestedUser[]> {
    return this.http.get<SuggestedUser[]>(`${this.usersUrl}/suggested`);
  }

  getAllUsers(page = 0, size = 10): Observable<Page<unknown>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<unknown>>(`${this.usersUrl}/explore`, { params });
  }

  searchUsers(query: string, page = 0, size = 10): Observable<Page<unknown>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (query) params = params.set('q', query);

    return this.http.get<Page<unknown>>(`${this.usersUrl}/search`, { params });
  }
}
