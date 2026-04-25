import { Component } from '@angular/core';

@Component({
  selector: 'app-banned-page',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Account Banned</h1>
          <p>Your account has been banned by the administrator.</p>
          <p style="margin-top: 8px;">If you think this is a mistake, contact support.</p>
        </div>
        <button class="main-btn" style="width: 100%" (click)="goToLogin()">Go to Login</button>
      </div>
    </div>
  `,
})
export class BannedPageComponent {
  goToLogin() {
    window.location.href = '/auth/login';
  }
}
