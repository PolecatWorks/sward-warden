import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SyncEngineService } from './services/sync-engine.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'temp-app';

  constructor(private syncEngine: SyncEngineService) {}
}
