import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  ResendEmailConfirmationRequest,
  ResetPasswordRequest,
  RegisteredUserResponse,
  RegisterRequest
} from '../../features/auth/models/auth.models';
import { API_CONFIG } from '../config/api.config';
import { TokenService } from './token.service';

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly sessionState = signal<SessionState>(this.readSessionState());

  readonly authenticated = computed(() => this.sessionState().isAuthenticated);
  readonly admin = computed(() => this.sessionState().isAdmin);

  initializeSession(): Observable<boolean> {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken && !this.tokenService.isTokenExpired(accessToken)) {
      this.syncSessionState();
      return of(true);
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.syncSessionState();
      return of(false);
    }

    return this.refreshAccessToken(refreshToken).pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl(API_CONFIG.auth.login), request)
      .pipe(tap((response) => this.setSession(response.accessToken, response.refreshToken)));
  }

  loginWithGoogle(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl(API_CONFIG.auth.googleLogin), request)
      .pipe(tap((response) => this.setSession(response.accessToken, response.refreshToken)));
  }

  register(request: RegisterRequest): Observable<RegisteredUserResponse> {
    return this.http.post<RegisteredUserResponse>(this.buildUrl(API_CONFIG.auth.register), request);
  }

  refreshAccessToken(refreshToken?: string): Observable<AuthResponse> {
    const token = refreshToken ?? this.tokenService.getRefreshToken();
    if (!token) {
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: RefreshTokenRequest = { refreshToken: token };

    return this.http.post<AuthResponse>(this.buildUrl(API_CONFIG.auth.refresh), payload).pipe(
      tap((response) => this.setSession(response.accessToken, response.refreshToken ?? token))
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    const payload: LogoutRequest = { refreshToken };

    return this.http.post<void>(this.buildUrl(API_CONFIG.auth.logout), payload).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clearSession())
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl(API_CONFIG.auth.forgotPassword), request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl(API_CONFIG.auth.resetPassword), request);
  }

  confirmEmail(token: string): Observable<RegisteredUserResponse> {
    return this.http.post<RegisteredUserResponse>(
      this.buildUrl(API_CONFIG.auth.confirmEmail) + '?token=' + encodeURIComponent(token),
      {}
    );
  }

  resendConfirmation(request: ResendEmailConfirmationRequest): Observable<void> {
    return this.http.post<void>(this.buildUrl(API_CONFIG.auth.resendConfirmation), request);
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  isAdmin(): boolean {
    return this.admin();
  }

  getAccessToken(): string | null {
    return this.sessionState().accessToken;
  }

  getRefreshToken(): string | null {
    return this.sessionState().refreshToken;
  }

  setSession(accessToken: string, refreshToken?: string | null): void {
    this.tokenService.setAccessToken(accessToken);
    if (refreshToken) {
      this.tokenService.setRefreshToken(refreshToken);
    }
    this.syncSessionState();
  }

  clearSession(): void {
    this.tokenService.clearTokens();
    this.syncSessionState();
  }

  private syncSessionState(): void {
    this.sessionState.set(this.readSessionState());
  }

  private readSessionState(): SessionState {
    const accessToken = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    const tokenValid = accessToken != null && !this.tokenService.isTokenExpired(accessToken);
    const roles = tokenValid && accessToken ? this.tokenService.getRoles(accessToken) : [];
    const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

    return {
      accessToken: tokenValid ? accessToken : null,
      refreshToken,
      isAuthenticated: tokenValid,
      isAdmin
    };
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
