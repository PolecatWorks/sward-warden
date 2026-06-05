import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserProfileComponent } from './user-profile.component';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockFarmService = jasmine.createSpyObj('FarmManagementService', ['getUsers', 'getUser', 'updateUser', 'addUser']);
    mockFarmService.getUsers.and.returnValue(of([{ id: 1, name: 'Test User', email: 'test@example.com' }]));
    mockFarmService.getUser.and.returnValue(of({ id: 1, name: 'Test User', email: 'test@example.com' }));
    mockFarmService.updateUser.and.returnValue(of({ id: 1, name: 'Updated User', email: 'test@example.com' }));
    mockFarmService.addUser.and.returnValue(of({ id: 2, name: 'New User', email: 'new@example.com' }));

    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockAuthService.getUserId.and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        { provide: FarmManagementService, useValue: mockFarmService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    component.users$.subscribe(users => {
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('Test User');
    });
    expect(mockFarmService.getUsers).toHaveBeenCalled();
  });

  it('should render the profile heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Operator Profile');
  });
});
