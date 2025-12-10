import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  userGrowth: ChartDataPoint[];
  postGrowth: ChartDataPoint[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin';

  // === STATS ===
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

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

  updateUserRole(id: string, role: string) {
    return this.http.patch(
      `${this.apiUrl}/users/${id}/role?role=${role}`,
      {}, 
      { responseType: 'text' }
    );
  }
}
