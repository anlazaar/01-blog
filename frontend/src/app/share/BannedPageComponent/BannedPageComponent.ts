import { Component } from '@angular/core';

@Component({
  selector: 'app-banned-page',
  template: `
    <div class="login-page">
      <div class="login-container">
        <h1>Account Banned</h1>
        <p>Your account has been banned by the administrator.</p>
        <p>If you think this is a mistake, contact support.</p>
        <button class="main-btn" (click)="goToLogin()">Go to Login</button>
      </div>
    </div>
  `,
})
export class BannedPageComponent {
  goToLogin() {
    window.location.href = '/auth/login';
  }
}
