import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserProfileComponent } from './user-profile.component';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// PRD Reference: 0003
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let mockFarmService: any;
  let mockAuthService: any;

  // PRD Reference: 0003
  beforeEach(async () => {
    mockFarmService = {
      getUsers: vi.fn().mockReturnValue(of([{ id: 1, name: 'Test User', email: 'test@example.com' }])),
      getUser: vi.fn().mockReturnValue(of({ id: 1, name: 'Test User', email: 'test@example.com' })),
      updateUser: vi.fn().mockReturnValue(of({ id: 1, name: 'Updated User', email: 'test@example.com' })),
      addUser: vi.fn().mockReturnValue(of({ id: 2, name: 'New User', email: 'new@example.com' })),
      deleteUser: vi.fn().mockReturnValue(of({}))
    };

    mockAuthService = {
      getUserId: vi.fn().mockReturnValue('1')
    };

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        // PRD Reference: 0003
        provideRouter([]),
        { provide: FarmManagementService, useValue: mockFarmService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0003
  it('should create', () => {
    // PRD Reference: 0003
    expect(component).toBeTruthy();
  });

  // PRD Reference: 0003
  it('should load users on init', () => {
    component.users$.subscribe((users) => {
      // PRD Reference: 0003
      expect(users.length).toBe(1);
      // PRD Reference: 0003
      expect(users[0].name).toBe('Test User');
    });
    // PRD Reference: 0003
    expect(mockFarmService.getUsers).toHaveBeenCalled();
  });
});
