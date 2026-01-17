import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { ToastService } from '../../services/toast.service';

export const AdminGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // 1. Check if logged in
  if (!tokenService.isAuthenticated()) {
    toastService.show('You must be logged in to view this page', 'error');
    router.navigate(['/auth/login']);
    return false;
  }

  // 2. Check if Admin
  if (!tokenService.isAdmin()) {
    toastService.show('Access Denied: Admins only', 'error');
    router.navigate(['/']);
    return false;
  }

  return true;
};
