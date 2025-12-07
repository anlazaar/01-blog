import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { ApiService } from '../../services/auth.service';
import { MaterialImports } from '../../material-imports';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, FontAwesomeModule, ...MaterialImports],
  providers: [ApiService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  faGoogle = faGoogle;
  faGithub = faGithub;
  errorMessage = '';

  private auth = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private tokenService = inject(TokenService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.auth.apiCommunicator('/login', this.loginForm.value).subscribe({
      next: (res) => {
        console.log('LOGIN SUCCESS', res);

        // 1. Save the token first so we can decode it
        this.tokenService.setToken(res.token);

        // 2. Check if the user is an Admin
        if (this.tokenService.isAdmin()) {
          this.router.navigate(['/admin']);
          return;
        }

        // 3. Normal user flow (check if profile is complete)
        if (!res.isCompleted) {
          this.router.navigate(['profile/complete-profile', this.tokenService.getUUID()]);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.log('LOGIN ERROR :', err);

        if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'something went wrong';
        }
      },
    });
  }
}
