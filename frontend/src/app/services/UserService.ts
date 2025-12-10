import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPublicProfileDTO } from '../models/USER/UserPublicProfileDTO';
import { UserResponse } from '../models/USER/UserResponse';
import { Page } from '../models/Page';

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
    );
  }

  unfollowUser(id: string) {
    return this.http.post(
      `http://localhost:8080/api/subscriptions/${id}/unfollow`,
      {},
    );
  }

  // Add to your UserService
  getSuggestedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/suggested`);
  }

  getAllUsers(page: number = 0, size: number = 10): Observable<Page<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<Page<any>>(`${this.api}/explore`, { params });
  }
}
