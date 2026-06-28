import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from '../sync-status/sync-status.component';
import { RxdbService } from '../services/rxdb/rxdb.service';
import { AuthService } from '../services/auth.service';
import { FarmManagementService } from '../services/farm-management.service';
import { DevAuthApiService } from '../services/dev-auth-api.service';
import { User } from '../models/user';
import { Observable, shareReplay } from 'rxjs';

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
  users$: Observable<User[]> | undefined;

  constructor(
    private rxdbService: RxdbService,
    private authService: AuthService,
    private farmManagementService: FarmManagementService,
    private devAuthApi: DevAuthApiService,
    private router: Router
  ) {
    this.fallbackToRest$ = this.rxdbService.fallbackToRest$;
  }

  // No obvious PRD requirement
  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.currentUser$ = this.farmManagementService.getUser(userId).pipe(shareReplay(1));
    }
    this.users$ = this.farmManagementService.getUsers().pipe(shareReplay(1));
  }

  // No obvious PRD requirement
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // No obvious PRD requirement
  switchUser(userId: string | number): void {
    const userIdStr = userId.toString();
    this.users$?.subscribe({
      next: (users) => {
        const selectedUser = users.find(u => u.id?.toString() === userIdStr);
        if (selectedUser && selectedUser.id !== undefined) {
          this.devAuthApi.getToken(selectedUser.id, selectedUser.role || 'user').subscribe({
            next: (response) => {
              this.authService.login(selectedUser.id!.toString(), response.access_token);
              this.reloadPage();
            },
            error: (err) => {
              console.error('Failed to get Dev JWT token on user switch:', err);
              this.authService.login(selectedUser.id!.toString());
              this.reloadPage();
            }
          });
        } else {
          this.authService.login(userIdStr);
          this.reloadPage();
        }
      },
      error: (err) => {
        console.error('Failed to fetch user list during switch:', err);
        this.authService.login(userIdStr);
        this.reloadPage();
      }
    });
  }

  // No obvious PRD requirement
  reloadPage(): void {
    window.location.reload();
  }
}
