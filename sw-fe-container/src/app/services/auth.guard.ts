import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { APP_CONFIG } from '../app-config';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const config = inject(APP_CONFIG);

  if (authService.isLoggedIn()) {
    return true;
  }

  if (config.auth) {
    authService.initCodeFlow();
    return false;
  }

  // Not logged in, redirect to login page
  return router.parseUrl('/login');
};
