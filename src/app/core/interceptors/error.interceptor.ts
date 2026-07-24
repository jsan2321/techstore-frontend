import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { AuthResponse } from '../../features/auth/models/auth.models';
import { AuthService } from '../auth/auth.service';
import { API_CONFIG } from '../config/api.config';

let refreshInProgress = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const canAttemptRefresh =
        error.status === 401 &&
        !isAuthEndpointRequest(req.url) &&
        !!authService.getRefreshToken();

      if (!canAttemptRefresh) {
        if (error.status === 401 && isAuthEndpointRequest(req.url)) {
          authService.clearSession();
          void router.navigate(['/auth/login']);
        }

        return throwError(() => error);
      }

      if (refreshInProgress) {
        return refreshTokenSubject.pipe(
          filter((token): token is string => token !== null),
          take(1),
          switchMap((token) => next(withBearerToken(req, token)))
        );
      }

      refreshInProgress = true;
      refreshTokenSubject.next(null);

      return authService.refreshAccessToken().pipe(
        switchMap((response: AuthResponse) => {
          refreshTokenSubject.next(response.accessToken);
          return next(withBearerToken(req, response.accessToken));
        }),
        catchError((refreshError) => {
          authService.clearSession();
          void router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
        finalize(() => {
          refreshInProgress = false;
        })
      );
    })
  );
};

function withBearerToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: 'Bearer ' + token
    }
  });
}

function isAuthEndpointRequest(url: string): boolean {
  const authPaths = [
    API_CONFIG.baseUrl + API_CONFIG.auth.login,
    API_CONFIG.baseUrl + API_CONFIG.auth.googleLogin,
    API_CONFIG.baseUrl + API_CONFIG.auth.register,
    API_CONFIG.baseUrl + API_CONFIG.auth.refresh,
    API_CONFIG.baseUrl + API_CONFIG.auth.logout,
    API_CONFIG.baseUrl + API_CONFIG.auth.forgotPassword,
    API_CONFIG.baseUrl + API_CONFIG.auth.resetPassword,
    API_CONFIG.baseUrl + API_CONFIG.auth.confirmEmail,
    API_CONFIG.baseUrl + API_CONFIG.auth.resendConfirmation
  ];

  return authPaths.some((path) => url.includes(path));
}
