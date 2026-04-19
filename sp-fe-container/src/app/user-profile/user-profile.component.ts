import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmManagementService } from '../services/farm-management.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  users$!: Observable<User[]>;

  constructor(private farmManagementService: FarmManagementService) {}

  ngOnInit(): void {
    this.users$ = this.farmManagementService.getUsers();
  }
}
