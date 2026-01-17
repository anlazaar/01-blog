import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  // 1. STATE: Initialize signal directly from LocalStorage
  // This is the Single Source of Truth for the entire service.
  private _token = signal<string | null>(localStorage.getItem('token'));

  // 2. COMPUTED STATE (Reactive)
  // These update automatically whenever _token changes.

  readonly isAuthenticated = computed(() => !!this._token());

  private _decodedToken = computed(() => {
    const token = this._token();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Invalid token format', e);
      return null;
    }
  });

  // Expose specific claims as computed signals
  readonly userId = computed(() => this._decodedToken()?.sub || null);
  readonly userRole = computed(() => this._decodedToken()?.role || null);
  readonly isAdminSignal = computed(() => this.userRole() === 'ADMIN');

  // 3. ACTIONS

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this._token.set(token); // Updating this triggers all computed signals above
  }

  clear(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); // Clean up role if you store it separately
    this._token.set(null);
  }

  // 4. HELPER METHODS (For imperative usage)
  // These allow you to get the *current value* without subscribing,
  // preserving compatibility with your existing logic (e.g., in Guards or Interceptors).

  getToken(): string | null {
    return this._token();
  }

  getUUID(): string | null {
    return this.userId();
  }

  isAdmin(): boolean {
    return this.isAdminSignal();
  }
}
