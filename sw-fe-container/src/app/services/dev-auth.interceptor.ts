import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { APP_CONFIG } from '../app-config';

export const devAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const config = inject(APP_CONFIG);

  let newReq = req;

  // Add JWT for dev/OIDC mode if Authorization header is missing
  if (!req.headers.has('Authorization')) {
    const token = authService.getToken();

    if (token) {
      newReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
    }
  }

  return next(newReq).pipe(
    // PRD Reference: 0014
    catchError((error: HttpErrorResponse) => {
      // Catch authentication/authorization errors
      if (error.status === 401) {
        authService.logout();
        if (config.auth) {
          authService.initCodeFlow();
        } else {
          router.navigate(['/login']);
        }
      } else if (error.status === 403 && authService.getToken()) {
        const errorMsg =
          error.error?.error ||
          'Authentication failed. Please check your credentials or access rights.';
        router.navigate(['/error'], { state: { error: errorMsg } });
      }
      return throwError(() => error);
    }),
  );
};
