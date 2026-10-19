import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.sessao().pipe(
    map(sessao => !route.data['mentora'] || sessao.role === 'mentoras' ? true : router.createUrlTree(['/home'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
