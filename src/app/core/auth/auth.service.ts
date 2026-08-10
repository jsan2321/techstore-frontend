import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {
  AuthResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  ResendEmailConfirmationRequest,
  ResetPasswordRequest,
  RegisteredUserResponse,
  RegisterRequest
} from '../../features/auth/models/auth.models';
import { API_CONFIG } from '../config/api.config';
import { TokenService } from './token.service';

type SessionState = {
  accessToken: string | null;
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

    if (localStorage.getItem('has_session') !== 'true') {
      this.clearSession();
      return of(false);
    }

    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl(API_CONFIG.auth.login), request, { withCredentials: true })
      .pipe(tap((response) => this.setSession(response.accessToken)));
  }

  loginWithGoogle(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl(API_CONFIG.auth.googleLogin), request, { withCredentials: true })
      .pipe(tap((response) => this.setSession(response.accessToken)));
  }

  register(request: RegisterRequest): Observable<RegisteredUserResponse> {
    return this.http.post<RegisteredUserResponse>(this.buildUrl(API_CONFIG.auth.register), request);
  }

  refreshAccessToken(): Observable<AuthResponse> {
    // withCredentials ensures the HttpOnly refresh cookie is sent even when the
    // Angular dev proxy is involved (changeOrigin rewrites Host, which can
    // otherwise suppress cookie forwarding in some browser/proxy combos).
    return this.http.get<AuthResponse>(this.buildUrl(API_CONFIG.auth.refresh), { withCredentials: true }).pipe(
      tap((response) => this.setSession(response.accessToken))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.buildUrl(API_CONFIG.auth.logout), {}, { withCredentials: true }).pipe(
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

  setSession(accessToken: string): void {
    localStorage.setItem('has_session', 'true');
    this.tokenService.setAccessToken(accessToken);
    this.syncSessionState();
  }

  clearSession(): void {
    localStorage.removeItem('has_session');
    this.tokenService.clearTokens();
    this.syncSessionState();
  }

  private syncSessionState(): void {
    this.sessionState.set(this.readSessionState());
  }

  private readSessionState(): SessionState {
    const accessToken = this.tokenService.getAccessToken();
    const tokenValid = accessToken != null && !this.tokenService.isTokenExpired(accessToken);
    const roles = tokenValid && accessToken ? this.tokenService.getRoles(accessToken) : [];
    const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

    return {
      accessToken: tokenValid ? accessToken : null,
      isAuthenticated: tokenValid,
      isAdmin
    };
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
