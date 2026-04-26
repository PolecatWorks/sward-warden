import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole(requiredRole)) {
      return true;
    }

    // Redirect to a forbidden page or dashboard if unauthorized
    // For now, just return false
    console.error(`Access denied: Required role ${requiredRole}`);
    return false;
  };
};
