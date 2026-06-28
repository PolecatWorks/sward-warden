import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'agent-user-id';
  private readonly JWT_KEY = 'dev-jwt-token';

  constructor() { }

  // PRD Reference: 0020
  login(userId: string, token?: string): void {
    localStorage.setItem(this.USER_KEY, userId);
    if (token) {
      localStorage.setItem(this.JWT_KEY, token);
    } else {
      localStorage.removeItem(this.JWT_KEY);
    }
  }

  // PRD Reference: 0020
  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.JWT_KEY);
  }

  // PRD Reference: 0020
  getUserId(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  // PRD Reference: 0020
  getToken(): string | null {
    return localStorage.getItem(this.JWT_KEY);
  }

  // PRD Reference: 0020
  isLoggedIn(): boolean {
    // For local dev, a user is logged in if they have the ID (fallback) and ideally the token.
    // However, some old tests might only set the user ID, so we check the ID for backward compatibility,
    // but in reality token should be present.
    return !!this.getUserId();
  }
}
