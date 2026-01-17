import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { ApiService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { environment } from '../../../environments/environment';

// Angular Material (Optional if you want to swap the CSS buttons for MatButtons,
// but based on your HTML, you are using custom CSS classes, so minimal imports are better)
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  // --- INJECTIONS ---
  private auth = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private tokenService = inject(TokenService);

  // --- ICONS ---
  faGoogle = faGoogle;
  faGithub = faGithub;

  // --- STATE SIGNALS ---
  errorMessage = signal('');
  isSubmitting = signal(false);

  private apiUrl = `${environment.apiUrl}`;

  // --- FORM ---
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.auth.apiCommunicator('/login', this.loginForm.value).subscribe({
      next: (res) => {
        // 1. Save Token (Triggers Signal updates in TokenService)
        this.tokenService.setToken(res.token);

        // 2. Navigation Logic
        if (this.tokenService.isAdmin()) {
          this.router.navigate(['admin/dashboard']);
          return;
        }

        // 3. Check for incomplete profile
        if (!res.isCompleted) {
          const uuid = this.tokenService.getUUID();
          this.router.navigate(['profile/complete-profile', uuid]);
        } else {
          this.router.navigate(['/']);
        }

        // No need to set isSubmitting(false) as we are navigating away
      },
      error: (err) => {
        console.error('Login Error:', err);
        this.isSubmitting.set(false);

        if (err.error?.error) {
          this.errorMessage.set(err.error.error);
        } else {
          this.errorMessage.set('Invalid credentials or server error.');
        }
      },
    });
  }

  loginWithGithub() {
    window.location.href = `${this.apiUrl}/oauth2/authorization/github`;
  }

  loginWithGoogle() {
    window.location.href = `${this.apiUrl}/oauth2/authorization/google`;
  }
}
