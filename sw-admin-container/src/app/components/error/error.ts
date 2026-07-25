import { Component } from '@angular/core';

@Component({
  selector: 'app-error',
  standalone: true,
  templateUrl: './error.html',
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
  `]
})
export class ErrorComponent {}
