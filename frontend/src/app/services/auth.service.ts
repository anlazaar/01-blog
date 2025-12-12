import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiService {
  // Base auth path
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  apiCommunicator(path: string, data: any): Observable<any> {
    // path comes in like '/login', so: localhost:8080/api/auth/login
    return this.http.post(`${this.baseUrl}${path}`, data);
  }
}
