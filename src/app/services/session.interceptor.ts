import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, filter, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl)) return next(request);
  const auth = inject(AuthService);
  const authenticated = request.clone({ withCredentials: true });
  const response = ['GET', 'HEAD', 'OPTIONS'].includes(request.method)
    ? next(authenticated)
    : next(authenticated.clone({ method: 'GET', url: `${environment.apiUrl}auth/csrf`, body: null }))
      .pipe(
        filter((event): event is HttpResponse<{ token: string; headerName: string }> => event instanceof HttpResponse),
        switchMap(event => next(authenticated.clone({ setHeaders: { [event.body!.headerName]: event.body!.token } })))
      );
  return response.pipe(catchError(error => {
    if (error.status === 401) auth.limparEstado();
    return throwError(() => error);
  }));
};
