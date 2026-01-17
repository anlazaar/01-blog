import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from '../models/Page';

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
  private apiUrl = `${environment.apiUrl}/admin`;

  // === STATS ===
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  // === USERS ===
  getAllUsers(page: number, size: number): Observable<Page<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<any>>(`${this.apiUrl}/users`, { params });
  }

  banUser(id: string): Observable<string> {
    return this.http.patch(`${this.apiUrl}/users/${id}/ban`, {}, { responseType: 'text' });
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { responseType: 'text' });
  }

  // === POSTS ===
  getAllPosts(page: number, size: number): Observable<Page<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<any>>(`${this.apiUrl}/posts`, { params });
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
      `${this.apiUrl}/users/${id}/role`,
      {},
      {
        params: { role },
        responseType: 'text',
      }
    );
  }
}
