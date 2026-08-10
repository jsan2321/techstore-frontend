import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { createErrorHandler, TraceService } from '@sentry/angular';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { API_CONFIG } from './core/config/api.config';
import { RUNTIME_CONFIG } from './core/config/runtime-config';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useFactory: () => RUNTIME_CONFIG.sentryDsn
        ? createErrorHandler({ showDialog: false, logErrors: false })
        : new ErrorHandler()
    },
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withInterceptorsFromDi(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })
    ),
    provideAppInitializer(() => {
      if (RUNTIME_CONFIG.sentryDsn) {
        inject(TraceService);
      }
    }),
    // Bootstrap CSRF first, then restore the session. Chained in a single
    // initializer so the XSRF cookie is guaranteed to be written before
    // initializeSession fires its GET /auth/refresh (which needs no CSRF but
    // the interceptor may queue other requests that do). This prevents the
    // stale-CSRF 401 that boots users out after returning from PayPal.
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      const authService = inject(AuthService);
      return firstValueFrom(
        http.get(API_CONFIG.baseUrl + '/csrf').pipe(
          catchError(() => of(null)),
          switchMap(() => authService.initializeSession())
        )
      );
    })
  ]
};

