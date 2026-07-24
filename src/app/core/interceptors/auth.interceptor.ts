import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  if (!token || tokenService.isTokenExpired(token) || req.headers.has('Authorization')) {
    return next(req);
  }

  const securedRequest = req.clone({
    setHeaders: {
      Authorization: 'Bearer ' + token
    }
  });

  return next(securedRequest);
};
