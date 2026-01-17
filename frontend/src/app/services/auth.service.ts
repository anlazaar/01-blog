import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/auth`;

  // Generic poster for auth endpoints (login, register, verify, etc.)
  apiCommunicator(path: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${path}`, data);
  }
}
