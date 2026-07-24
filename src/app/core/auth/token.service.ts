import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

type JwtPayload = {
  exp?: number;
  roles?: string[];
  authorities?: string[];
  role?: string;
};

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
