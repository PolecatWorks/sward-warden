import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from '../sync-status/sync-status.component';
import { RxdbService } from '../services/rxdb/rxdb.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, SyncStatusComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  readonly fallbackToRest$: Observable<boolean>;

  constructor(private rxdbService: RxdbService) {
    this.fallbackToRest$ = this.rxdbService.fallbackToRest$;
  }
}
