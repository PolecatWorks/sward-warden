import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error-page.component.html',
})
export class ErrorPageComponent {
  errorMessage: string = 'An unexpected error occurred.';
  isAuthError: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { error?: string };
    if (state && state.error) {
      this.errorMessage = state.error;
    } else {
      // Fallback if accessed later
      const historyState = history.state as { error?: string };
      if (historyState && historyState.error) {
        this.errorMessage = historyState.error;
      }
    }

    if (
      this.errorMessage.includes('Authentication failed') ||
      this.errorMessage.includes('credentials') ||
      this.errorMessage.includes('access rights')
    ) {
      this.isAuthError = true;
    }
  }

  goHome() {
    if (this.isAuthError) {
      this.authService.logout();
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
