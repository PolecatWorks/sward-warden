import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from '../sync-status/sync-status.component';
import { RxdbService } from '../services/rxdb/rxdb.service';
import { AuthService } from '../services/auth.service';
import { FarmManagementService } from '../services/farm-management.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, SyncStatusComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  readonly fallbackToRest$: Observable<boolean>;
  currentUser$!: Observable<User>;

  constructor(
    private rxdbService: RxdbService,
    private authService: AuthService,
    private farmManagementService: FarmManagementService,
    private router: Router
  ) {
    this.fallbackToRest$ = this.rxdbService.fallbackToRest$;
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.currentUser$ = this.farmManagementService.getUser(userId);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
