import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      } else if (error.status === 403 && error.error?.error === 'Your account has been banned') {
        localStorage.removeItem('token');
        window.location.href = '/banned';
      }

      return throwError(() => error);
    })
  );
};
