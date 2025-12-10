import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `<div style="text-align:center; padding: 50px;">Processing login...</div>`,
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const isNew = params['isNew'] === 'true';
      const userId = params['userId'];

      if (token) {
        this.tokenService.setToken(token);

        if (this.tokenService.isAdmin()) {
          this.router.navigate(['/admin/dashboard']);
        } else if (isNew && userId) {
          // Redirect to complete profile if needed
          this.router.navigate(['/profile/complete-profile', userId]);
        } else {
          this.router.navigate(['/']);
        }
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
