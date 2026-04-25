import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FarmManagementService } from '../services/farm-management.service';
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
  userForm: FormGroup;

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
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.users$ = this.farmManagementService.getUsers();
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
