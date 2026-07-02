import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load users');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  toggleSuspension(user: User): void {
    const updatedUser = { ...user, is_suspended: !user.is_suspended };
    this.userService.updateUser(user.id, updatedUser).subscribe({
      next: (updated) => {
        this.users.update(users => users.map(u => u.id === updated.id ? updated : u));
      },
      error: (err) => {
        console.error('Failed to update suspension status', err);
      }
    });
  }

  toggleModule(user: User, moduleName: string): void {
    const currentModules = user.modules || [];
    const hasModule = currentModules.includes(moduleName);

    let newModules;
    if (hasModule) {
      newModules = currentModules.filter(m => m !== moduleName);
    } else {
      newModules = [...currentModules, moduleName];
    }

    const updatedUser = { ...user, modules: newModules };
    this.userService.updateUser(user.id, updatedUser).subscribe({
      next: (updated) => {
        this.users.update(users => users.map(u => u.id === updated.id ? updated : u));
      },
      error: (err) => {
        console.error('Failed to update modules', err);
      }
    });
  }
}
