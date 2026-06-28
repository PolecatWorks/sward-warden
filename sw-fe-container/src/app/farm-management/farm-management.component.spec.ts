import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { FarmManagementComponent } from './farm-management.component';
import { FarmManagementService } from '../services/farm-management.service';
import { AuthService } from '../services/auth.service';

// PRD Reference: 0003
describe('FarmManagementComponent', () => {
  let component: FarmManagementComponent;
  let fixture: ComponentFixture<FarmManagementComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let farmsSubject: BehaviorSubject<any[]>;

  // PRD Reference: 0003
  beforeEach(async () => {
    farmsSubject = new BehaviorSubject<any[]>([
      { id: 1, user_id: 1, name: 'Test Farm', location: 'Test Location' },
    ]);

    mockFarmService = jasmine.createSpyObj('FarmManagementService', [
      'getUsers',
      'getUser',
      'getFarms',
      'getFields',
      'getEvents',
      'addFarm',
      'addField',
    ]);
    mockFarmService.getUsers.and.returnValue(
      of([
        { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
      ]),
    );
    mockFarmService.getUser.and.returnValue(
      of({ id: 1, name: 'Test User', email: 'test@example.com', role: 'user' }),
    );
    mockFarmService.getFarms.and.returnValue(farmsSubject.asObservable());
    mockFarmService.getFields.and.returnValue(
      of([{ id: 1, farm_id: 1, name: 'Test Field', area_hectares: 10 }]),
    );
    mockFarmService.getEvents.and.returnValue(
      of([
        {
          id: 1,
          field_id: 1,
          event_type: 'Test Event',
          description: 'Test',
          date: '2024-01-01',
        },
      ]),
    );

    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockAuthService.getUserId.and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [FarmManagementComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        // PRD Reference: 0003
        provideRouter([]),
        { provide: FarmManagementService, useValue: mockFarmService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0003
  it('should create', () => {
    // PRD Reference: 0003
    expect(component).toBeTruthy();
  });

  // PRD Reference: 0003
  it('should load data on init', () => {
    // PRD Reference: 0003
    expect(mockFarmService.getUsers).toHaveBeenCalled();
    // PRD Reference: 0003
    expect(mockFarmService.getFarms).toHaveBeenCalled();
    // PRD Reference: 0003
    expect(mockFarmService.getFields).toHaveBeenCalled();
    // PRD Reference: 0003
    expect(mockFarmService.getEvents).toHaveBeenCalled();
  });

  // PRD Reference: 0003
  it('should require new form controls', () => {
    // PRD Reference: 0003
    expect(component.farmForm.contains('user_id')).toBeTrue();
    // PRD Reference: 0003
    expect(component.fieldForm.contains('farm_id')).toBeTrue();
    // PRD Reference: 0003
    expect(component.eventForm.contains('field_id')).toBeTrue();
  });

  // PRD Reference: 0003
  it('should make farm_id optional for non-admin when no farms exist', () => {
    farmsSubject.next([]); // No farms
    fixture.detectChanges();

    const farmIdControl = component.fieldForm.get('farm_id');
    // Using simple approach to check required validation state.
    farmIdControl?.setValue(null);
    // PRD Reference: 0003
    expect(farmIdControl?.hasError('required')).toBeFalse();
  });

  // PRD Reference: 0003
  it('should make farm_id required for admin even when no farms exist', () => {
    component.currentUser = {
      id: 2,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    };
    farmsSubject.next([]); // No farms
    fixture.detectChanges();

    const farmIdControl = component.fieldForm.get('farm_id');
    // PRD Reference: 0003
    expect(farmIdControl?.hasError('required')).toBeTrue();
  });

  // PRD Reference: 0003
  it('should auto-create farm and assign field when non-admin submits field without farm', () => {
    farmsSubject.next([]);
    fixture.detectChanges();

    mockFarmService.addFarm.and.returnValue(
      of({
        id: 99,
        user_id: 1,
        name: 'Default Farm',
        location: 'Default Location',
      }),
    );
    mockFarmService.addField.and.returnValue(
      of({ id: 100, farm_id: 99, name: 'New Field', area_hectares: 5 }),
    );

    component.fieldForm.setValue({
      farm_id: null,
      name: 'New Field',
      area_hectares: 5,
    });
    component.onSubmitField();

    // PRD Reference: 0003
    expect(mockFarmService.addFarm).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Default Farm', user_id: 1 }),
    );
    // PRD Reference: 0003
    expect(mockFarmService.addField).toHaveBeenCalledWith(
      jasmine.objectContaining({ farm_id: 99, name: 'New Field' }),
    );
  });
});
