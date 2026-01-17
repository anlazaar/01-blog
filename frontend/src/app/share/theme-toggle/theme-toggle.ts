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
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();

      if (isPlatformBrowser(this.platformId)) {
        if (dark) {
          this.document.body.classList.add('dark');
        } else {
          this.document.body.classList.remove('dark');
        }

        localStorage.setItem('darkMode', String(dark));
      }
    });
  }

  private getInitialTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  toggleTheme(): void {
    this.isDarkMode.update((current) => !current);
  }
}
