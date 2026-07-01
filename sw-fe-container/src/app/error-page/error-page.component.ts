import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error-page.component.html',
})
export class ErrorPageComponent {
  errorMessage: string = 'An unexpected error occurred.';

  constructor(private router: Router) {
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
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
