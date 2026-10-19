import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  if (userId && userRole) {
    return router.createUrlTree(['/mentorias']);
  }

  return true;
};
