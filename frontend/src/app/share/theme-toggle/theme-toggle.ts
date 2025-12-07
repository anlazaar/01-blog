import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  standalone: true,
  imports: [FontAwesomeModule],
  styleUrls: ['./theme-toggle.css'], // Removed dependency on navbar css
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode: boolean = false;
  faSun = faSun;
  faMoon = faMoon;

  ngOnInit(): void {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'true';
    } else {
      // Optional: Check system preference if no user preference is saved
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.updateBodyClass();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.updateBodyClass();
  }

  private updateBodyClass(): void {
    // We toggle the class 'dark' to match the Global CSS :root .dark selector
    if (this.isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
