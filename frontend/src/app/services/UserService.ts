import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPublicProfileDTO } from '../models/USER/UserPublicProfileDTO';
import { UserResponse } from '../models/USER/UserResponse';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getUserPublicProfile(id: string): Observable<UserPublicProfileDTO> {
    return this.http.get<any>(`${this.api}/${id}/block`);
  }

  getUserFullData(id: string): Observable<UserResponse> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  patchUser(req: FormData, id: String) {
    console.log('REQUEST: ', req);
    return this.http.patch<any>(`${this.api}/profile/update/${id}`, req);
  }

  followUser(id: string) {
    return this.http.post(
      `http://localhost:8080/api/subscriptions/${id}/follow`,
      {},
      { withCredentials: true }
    );
  }

  unfollowUser(id: string) {
    return this.http.post(
      `http://localhost:8080/api/subscriptions/${id}/unfollow`,
      {},
      { withCredentials: true }
    );
  }

  // Add to your UserService
  getSuggestedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/suggested`);
  }
}
