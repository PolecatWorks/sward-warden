import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { DevAuthApiService } from '../services/dev-auth-api.service';
import { User } from '../models/user';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  users$!: Observable<User[]>;
  errorMsg: string | null = null;
  showCreateForm = false;
  createUserForm!: FormGroup;
  isSubmitting = false;

  private refreshUsers$ = new BehaviorSubject<void>(undefined);

  constructor(
    private farmManagementService: FarmManagementService,
    private devAuthApi: DevAuthApiService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      phone: [''],
      description: ['']
    });

    this.users$ = this.refreshUsers$.pipe(
      switchMap(() => this.farmManagementService.getUsers().pipe(
        catchError(err => {
          console.error('Error fetching users:', err);
          setTimeout(() => {
            this.errorMsg = 'Failed to load users from the backend server. Is the backend running?';
          });
          return of([]);
        })
      ))
    );
  }

  loginAs(user: User): void {
    if (user && user.id !== undefined) {
      this.devAuthApi.getToken(user.id, user.role || 'user').subscribe({
        next: (response) => {
          this.authService.login(user.id.toString(), response.access_token);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Failed to get Dev JWT token:', err);
          this.errorMsg = 'Failed to get dev authentication token. Is dev auth enabled in backend?';
        }
      });
    }
  }

  deleteUser(event: Event, user: User): void {
    event.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete the user "${user.name}"? This will delete all of their farms, fields, and records.`);
    if (!confirmed) {
      return;
    }
    this.farmManagementService.deleteUser(user.id).subscribe({
      next: () => {
        this.refreshUsers$.next();
      },
      error: (err) => {
        this.errorMsg = 'Failed to delete user. Please try again.';
        console.error('Error deleting user:', err);
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createUserForm.reset({ role: 'user' });
    }
  }

  onSubmitUser(): void {
    if (this.createUserForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = null;
    const newUser: User = {
      id: 0,
      ...this.createUserForm.value
    };

    this.farmManagementService.addUser(newUser).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showCreateForm = false;
        this.createUserForm.reset({ role: 'user' });
        this.refreshUsers$.next();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMsg = 'Failed to create user. Please ensure the backend is running and details are correct.';
        console.error('Error creating user:', err);
      }
    });
  }
}
