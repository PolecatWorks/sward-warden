import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserProfileComponent } from './user-profile.component';
import { FarmManagementService } from '../services/farm-management.service';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;

  beforeEach(async () => {
    mockFarmService = jasmine.createSpyObj('FarmManagementService', ['getUsers']);
    mockFarmService.getUsers.and.returnValue(of([{ id: 1, name: 'Test User', email: 'test@example.com' }]));

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: FarmManagementService, useValue: mockFarmService }
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
});
