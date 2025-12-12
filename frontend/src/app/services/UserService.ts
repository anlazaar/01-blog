import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPublicProfileDTO } from '../models/USER/UserPublicProfileDTO';
import { UserResponse } from '../models/USER/UserResponse';
import { Page } from '../models/Page';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersUrl = `${environment.apiUrl}/users`;
  private subscriptionsUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

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

  followUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/follow`, {});
  }

  unfollowUser(id: string) {
    return this.http.post(`${this.subscriptionsUrl}/${id}/unfollow`, {});
  }

  getSuggestedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.usersUrl}/suggested`);
  }

  getAllUsers(page: number = 0, size: number = 10): Observable<Page<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<any>>(`${this.usersUrl}/explore`, { params });
  }
}
