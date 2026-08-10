import { Injectable } from '@angular/core';

type JwtPayload = {
  exp?: number;
  roles?: string[];
  authorities?: string[];
  role?: string;
};

const ACCESS_TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  clearTokens(): void {
    this.accessToken = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload?.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds;
  }

  getRoles(token: string): string[] {
    const payload = this.decodePayload(token);
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload.roles)) {
      return payload.roles;
    }

    if (Array.isArray(payload.authorities)) {
      return payload.authorities;
    }

    if (typeof payload.role === 'string') {
      return [payload.role];
    }

    return [];
  }

  private decodePayload(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
