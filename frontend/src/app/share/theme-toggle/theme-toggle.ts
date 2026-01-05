import {
  Component,
  signal,
  effect,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  // Injections for safe DOM access
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  // State Signal
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();

    // Effect: Automatically runs whenever isDarkMode() changes
    effect(() => {
      const dark = this.isDarkMode();

      // Ensure we are in the browser before touching DOM or LocalStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('darkMode', String(dark));

        if (dark) {
          this.document.body.classList.add('dark');
        } else {
          this.document.body.classList.remove('dark');
        }
      }
    });
  }

  private initializeTheme() {
    // Only run initialization logic in the browser
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme) {
        this.isDarkMode.set(savedTheme === 'true');
      } else {
        // Fallback to system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode.set(systemDark);
      }
    }
  }

  toggleTheme(): void {
    // Simple boolean toggle
    this.isDarkMode.update((current) => !current);
  }
}
