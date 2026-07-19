import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly USER_KEY = 'agent-user-id';
  private readonly JWT_KEY = 'dev-jwt-token';

  constructor() {}

  // PRD Reference: 0014
  login(userId: string, token?: string): void {
    localStorage.setItem(this.USER_KEY, userId);
    if (token) {
      localStorage.setItem(this.JWT_KEY, token);
    } else {
      localStorage.removeItem(this.JWT_KEY);
    }
  }

  // PRD Reference: 0014
  logout(): void {
    if (this.oauthService.hasValidAccessToken()) {
      this.oauthService.logOut();
    }
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.JWT_KEY);
  }

  // PRD Reference: 0014
  getUserId(): string | null {
    if (this.oauthService.hasValidAccessToken()) {
      const claims = this.oauthService.getIdentityClaims();
      return claims ? (claims['sub'] || null) : null;
    }
    return localStorage.getItem(this.USER_KEY);
  }

  // PRD Reference: 0014
  getToken(): string | null {
    if (this.oauthService.hasValidAccessToken()) {
      return this.oauthService.getAccessToken();
    }
    return localStorage.getItem(this.JWT_KEY);
  }

  // PRD Reference: 0014
  isLoggedIn(): boolean {
    if (this.oauthService.hasValidAccessToken()) {
      return true;
    }
    return !!localStorage.getItem(this.USER_KEY);
  }

  initCodeFlow(): void {
    this.oauthService.initCodeFlow();
  }
}
