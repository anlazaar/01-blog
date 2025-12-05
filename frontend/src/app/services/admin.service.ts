import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin';

  // === USERS ===
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  banUser(id: string): Observable<string> {
    return this.http.patch(`${this.apiUrl}/users/${id}/ban`, {}, { responseType: 'text' });
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { responseType: 'text' });
  }

  // === POSTS ===
  getAllPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/posts`);
  }

  // === REPORTS ===
  getAllReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports`);
  }

  resolveReport(id: string): Observable<string> {
    return this.http.patch(`${this.apiUrl}/reports/${id}/resolve`, {}, { responseType: 'text' });
  }
}
