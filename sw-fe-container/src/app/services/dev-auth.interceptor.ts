import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const devAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  let newReq = req;

  // Add JWT for dev mode if Authorization header is missing
  if (!req.headers.has('Authorization')) {
    const token = authService.getToken();

    if (token) {
      newReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
  }

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Catch authentication/authorization errors and route to the error page
      if (error.status === 401 || error.status === 403) {
        const errorMsg = error.error?.error || 'Authentication failed. Please check your credentials or access rights.';
        router.navigate(['/error'], { state: { error: errorMsg } });
      }
      return throwError(() => error);
    })
  );
};
