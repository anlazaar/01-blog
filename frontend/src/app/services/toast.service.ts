import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // 1. STATE: Single source of truth for UI notifications
  private _toasts = signal<Toast[]>([]);

  // Public read-only access
  readonly toasts = this._toasts.asReadonly();

  // 2. ACTIONS
  show(message: string, type: ToastType = 'success') {
    // Simple ID generator (crypto.randomUUID works in modern browsers/https)
    // Fallback for older environments if needed: Math.random().toString(36)
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();

    const newToast: Toast = { id, message, type };

    // Update state immutably
    this._toasts.update((current) => [...current, newToast]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: string) {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
