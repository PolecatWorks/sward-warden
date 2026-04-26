import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const role = authService.getUserRole();

  if (role) {
    req = req.clone({
      setHeaders: {
        'X-User-Role': role
      }
    });
  }

  return next(req);
};
