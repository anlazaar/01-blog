import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { ApiService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  // --- INJECTIONS ---
  private auth = inject(ApiService);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private fb = inject(FormBuilder);

  // --- ICONS ---
  faGoogle = faGoogle;
  faGithub = faGithub;

  // --- STATE SIGNALS ---
  isSubmitting = signal(false);
  errorMessage = signal('');

  private apiUrl = `${environment.apiUrl}`;

  // --- FORM SETUP ---
  registerForm = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const repeatPassword = form.get('repeatPassword')?.value;

    // We set the error on the specific control so the template can check it easily
    if (password && repeatPassword && password !== repeatPassword) {
      form.get('repeatPassword')?.setErrors({ passwordMismatch: true });
    } else {
      // Don't nullify if there are other errors (like required)
      const errors = form.get('repeatPassword')?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          form.get('repeatPassword')?.setErrors(null);
        }
      }
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Exclude repeatPassword from payload
    const { repeatPassword, ...dataToSend } = this.registerForm.value;

    this.auth.apiCommunicator('/register', dataToSend).subscribe({
      next: (res) => {
        // 1. Save Token
        this.tokenService.setToken(res.token);

        // 2. Navigate
        if (!res.isCompleted) {
          const uuid = this.tokenService.getUUID();
          this.router.navigate(['profile/complete-profile', uuid]);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);

        if (err.error?.error) {
          this.errorMessage.set(err.error.error);
        } else {
          this.errorMessage.set('Registration failed. Please try again.');
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
