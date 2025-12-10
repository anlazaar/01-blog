import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(20px) scale(0.95)', opacity: 0 }),
        animate(
          '400ms cubic-bezier(0.16, 1, 0.3, 1)', // Apple-like spring curve
          style({ transform: 'translateY(0) scale(1)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(10px) scale(0.95)', opacity: 0 })),
      ]),
    ]),
  ],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-glass"
        [ngClass]="toast.type"
        @toastAnimation
      >
        <!-- Icon -->
        <div class="toast-icon">
          <fa-icon *ngIf="toast.type === 'success'" [icon]="faCheck"></fa-icon>
          <fa-icon *ngIf="toast.type === 'error'" [icon]="faError"></fa-icon>
          <fa-icon *ngIf="toast.type === 'info'" [icon]="faInfo"></fa-icon>
        </div>

        <!-- Message -->
        <div class="toast-content">
          <span class="toast-message">{{ toast.message }}</span>
        </div>

        <!-- Close Button -->
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <fa-icon [icon]="faClose"></fa-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 32px; /* Slightly higher */
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        align-items: center;
      }

      .toast-glass {
        pointer-events: auto;
        min-width: 340px;
        max-width: 500px;

        /* --- GLASS EFFECT --- */
        /* Use your global --foreground (dark) but make it 85% opaque */
        background: color-mix(in srgb, var(--foreground) 85%, transparent);

        /* The Blur - this creates the "Frosted" look over content behind it */
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);

        /* Text Color: Always white/light because background is dark glass */
        color: var(--background);

        /* Border: Very subtle, slightly lighter than bg to mimic glass edge */
        border: 1px solid rgba(255, 255, 255, 0.1);

        /* Shadow: Deep and soft to lift it off the page */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 12px 24px -4px rgba(0, 0, 0, 0.2);

        border-radius: 12px; /* Softer, more modern corners */
        padding: 14px 18px;

        display: flex;
        align-items: flex-start; /* Align top for long text */
        gap: 14px;

        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
      }

      /* --- Type Indicators (Glowing Left Border) --- */
      /* Instead of a hard border, we use a box-shadow glow */
      .toast-glass.success {
        box-shadow: inset 3px 0 0 0 #1a8917, 0 12px 24px -4px rgba(0, 0, 0, 0.2);
      }
      .toast-glass.error {
        box-shadow: inset 3px 0 0 0 #d93025, 0 12px 24px -4px rgba(0, 0, 0, 0.2);
      }
      .toast-glass.info {
        box-shadow: inset 3px 0 0 0 var(--text-secondary), 0 12px 24px -4px rgba(0, 0, 0, 0.2);
      }

      /* --- Icons --- */
      .toast-icon {
        display: flex;
        align-items: center;
        margin-top: 2px; /* Optical alignment with text */
        font-size: 16px;
      }
      .toast-glass.success .toast-icon {
        color: #4ade80;
      } /* Neon Green */
      .toast-glass.error .toast-icon {
        color: #f87171;
      } /* Neon Red */
      .toast-glass.info .toast-icon {
        color: #94a3b8;
      }

      .toast-content {
        flex: 1;
      }

      .toast-message {
        display: block;
      }

      /* --- Close Button --- */
      .toast-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5); /* Semi-transparent white */
        cursor: pointer;
        padding: 4px;
        margin: -4px -4px 0 0;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 1);
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);
  faCheck = faCheckCircle;
  faError = faExclamationCircle;
  faInfo = faInfoCircle;
  faClose = faTimes;
}
