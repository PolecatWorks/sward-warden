import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockFarmService = jasmine.createSpyObj('FarmManagementService', ['getUser']);
    mockFarmService.getUser.and.returnValue(of({ id: 1, name: 'Test User', email: 'test@example.com' }));

    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockAuthService.getUserId.and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        { provide: FarmManagementService, useValue: mockFarmService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the operator profile section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Operator Profile');
  });
});
