import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  users$!: Observable<User[]>;
  userForm: FormGroup;

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
        id: Math.floor(Math.random() * 10000), // Simple ID generation
        name: this.userForm.value.name,
        email: this.userForm.value.email
      };
      this.farmManagementService.addUser(newUser).subscribe(() => {
        // Refresh the list
        this.users$ = this.farmManagementService.getUsers();
        this.userForm.reset();
      });
    }
  }
}
