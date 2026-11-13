import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as string[] | undefined;
  return auth.sessao().pipe(
    map(sessao => {
      const papelPermitido = !roles || roles.includes(sessao.role);
      const mentoraPermitida = !route.data['mentora'] || sessao.role === 'mentoras';
      return papelPermitido && mentoraPermitida ? true : router.createUrlTree(['/home']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
