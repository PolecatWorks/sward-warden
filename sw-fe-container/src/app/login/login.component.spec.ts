import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { of, throwError, timer } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockFarmService = jasmine.createSpyObj('FarmManagementService', ['getUsers', 'addUser']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockFarmService.getUsers.and.returnValue(of([
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin' }
    ]));

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: FarmManagementService, useValue: mockFarmService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and display users on init', () => {
    expect(mockFarmService.getUsers).toHaveBeenCalled();
    component.users$.subscribe(users => {
      expect(users.length).toBe(2);
      expect(users[0].name).toBe('Alice');
      expect(users[1].name).toBe('Bob');
    });
  });

  it('should display error message if fetch fails', fakeAsync(() => {
    mockFarmService.getUsers.and.returnValue(throwError(() => new Error('Server offline')));

    component.ngOnInit();
    fixture.detectChanges();

    let usersLength = -1;
    component.users$.subscribe(users => {
      usersLength = users.length;
    });

    tick();
    fixture.detectChanges();

    expect(component.errorMsg).toContain('Failed to load users');
    expect(usersLength).toBe(0);
  }));

  it('should login and navigate when loginAs is called', () => {
    component.loginAs(1);
    expect(mockAuthService.login).toHaveBeenCalledWith('1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should toggle create user form visibility and reset form controls', () => {
    expect(component.showCreateForm).toBeFalse();
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeTrue();

    component.createUserForm.patchValue({ name: 'Declan', email: 'declan@test.com' });
    component.toggleCreateForm();
    expect(component.showCreateForm).toBeFalse();
    expect(component.createUserForm.get('name')?.value).toBeNull();
  });

  it('should validate required fields in create user form', () => {
    component.toggleCreateForm();
    const form = component.createUserForm;
    expect(form.valid).toBeFalse();

    const nameControl = form.get('name');
    const emailControl = form.get('email');

    nameControl?.setValue('');
    emailControl?.setValue('invalid-email');
    expect(form.valid).toBeFalse();
    expect(emailControl?.hasError('email')).toBeTrue();

    nameControl?.setValue('Declan');
    emailControl?.setValue('declan@example.com');
    expect(form.valid).toBeTrue();
  });

  it('should successfully submit new user and refresh list', fakeAsync(() => {
    mockFarmService.addUser.and.returnValue(of({
      id: 3,
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'support'
    }).pipe(delay(50)));

    component.toggleCreateForm();
    component.createUserForm.patchValue({
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'support',
      phone: '12345',
      description: 'New support operator'
    });

    component.onSubmitUser();
    expect(component.isSubmitting).toBeTrue();

    tick(50);
    fixture.detectChanges();

    expect(mockFarmService.addUser).toHaveBeenCalledWith({
      id: 0,
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'support',
      phone: '12345',
      description: 'New support operator'
    });

    expect(component.isSubmitting).toBeFalse();
    expect(component.showCreateForm).toBeFalse();
    expect(mockFarmService.getUsers).toHaveBeenCalledTimes(2); // Initial + reload
  }));

  it('should handle submission error gracefully', fakeAsync(() => {
    mockFarmService.addUser.and.returnValue(
      timer(50).pipe(switchMap(() => throwError(() => new Error('DB Error'))))
    );

    component.toggleCreateForm();
    component.createUserForm.patchValue({
      name: 'Error User',
      email: 'err@example.com',
      role: 'user'
    });

    component.onSubmitUser();
    expect(component.isSubmitting).toBeTrue();

    tick(50);
    fixture.detectChanges();

    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMsg).toContain('Failed to create user');
    expect(component.showCreateForm).toBeTrue(); // Keeps form open
  }));
});
