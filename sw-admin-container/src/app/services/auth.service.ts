import { Injectable, signal } from '@angular/core';

export type UserRole = 'user' | 'support' | 'admin';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userRole = signal<UserRole | null>('admin'); // Default to admin for now to allow development

  getUserRole(): UserRole | null {
    return this.userRole();
  }

  setUserRole(role: UserRole | null) {
    this.userRole.set(role);
  }

  hasRole(role: UserRole): boolean {
    const currentRole = this.userRole();
    if (!currentRole) return false;

    if (currentRole === 'admin') return true;
    if (currentRole === 'support' && role !== 'admin') return true;
    return currentRole === role;
  }
}
