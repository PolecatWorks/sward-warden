import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  users$!: Observable<User[]>;

  constructor(
    private farmManagementService: FarmManagementService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.users$ = this.farmManagementService.getUsers();
  }

  loginAs(userId: number | undefined): void {
    if (userId !== undefined) {
      this.authService.login(userId.toString());
      this.router.navigate(['/home']);
    }
  }
}
