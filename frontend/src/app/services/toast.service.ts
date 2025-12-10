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
  // We use a Signal to reactively update the UI
  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'success') {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type };

    // Add to the list
    this.toasts.update((current) => [...current, newToast]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
