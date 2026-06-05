import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  users$!: Observable<User[]>;
  currentUser$!: Observable<User>;
  userForm: FormGroup; // For adding team members
  editProfileForm: FormGroup; // For editing the current user
  currentUserData?: User; // Store the user data

  // A local variable to store current user id for updates
  currentUserId!: string;

  activeModules = [
    { name: 'Slurry Management Dashboard', icon: 'dashboard', active: true },
    { name: 'Compliance & Regulatory Hub', icon: 'assignment_turned_in', active: true },
    { name: 'Inventory & Equipment', icon: 'inventory', active: true },
    { name: 'Reporting & Export', icon: 'summarize', active: true },
    { name: 'Optimization Engine', icon: 'auto_awesome', active: false },
    { name: 'Weather Integration', icon: 'cloud', active: true },
  ];

  constructor(
    private farmManagementService: FarmManagementService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.editProfileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.users$ = this.farmManagementService.getUsers();


    const authId = this.authService.getUserId();
    this.currentUserId = authId || '1';

    this.loadCurrentUser();
  }

  loadCurrentUser() {
      this.currentUser$ = this.farmManagementService.getUser(this.currentUserId);
      this.currentUser$.subscribe(user => {
          if (user) {
              this.currentUserData = user;
              this.editProfileForm.patchValue({
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '',
                  description: user.description || ''
              });
          }
      });
  }

  onEditProfileSubmit(): void {
      if (this.editProfileForm.valid && this.currentUserData) {
          const updatedUser: User = {
              id: this.currentUserData.id,
              name: this.editProfileForm.value.name,
              email: this.editProfileForm.value.email,
              role: this.currentUserData.role,
              phone: this.editProfileForm.value.phone,
              description: this.editProfileForm.value.description
          };

          this.farmManagementService.updateUser(this.currentUserId, updatedUser).subscribe(() => {
              this.loadCurrentUser();
          });
      }
  }

  onSubmitUser(): void {
    if (this.userForm.valid) {
      const newUser: User = {
        id: Math.floor(Math.random() * 10000),
        name: this.userForm.value.name,
        email: this.userForm.value.email
      };
      this.farmManagementService.addUser(newUser).subscribe(() => {
        this.users$ = this.farmManagementService.getUsers();
        this.userForm.reset();
      });
    }
  }
}
