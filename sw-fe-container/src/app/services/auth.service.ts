import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'agent-user-id';

  constructor() { }

  login(userId: string): void {
    localStorage.setItem(this.USER_KEY, userId);
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getUserId();
  }
}
