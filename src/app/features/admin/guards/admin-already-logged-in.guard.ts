import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Redirects already-authenticated admins away from /admin/login to /admin.
 * Prevents admins from seeing the login page when they're already signed in.
 */
export const adminAlreadyLoggedInGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};
