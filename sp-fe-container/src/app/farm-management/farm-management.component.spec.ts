import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FarmManagementComponent } from './farm-management.component';
import { FarmManagementService } from '../services/farm-management.service';

describe('FarmManagementComponent', () => {
  let component: FarmManagementComponent;
  let fixture: ComponentFixture<FarmManagementComponent>;
  let mockFarmService: jasmine.SpyObj<FarmManagementService>;

  beforeEach(async () => {
    mockFarmService = jasmine.createSpyObj('FarmManagementService', ['getFarms', 'getFields', 'getEvents']);
    mockFarmService.getFarms.and.returnValue(of([{ id: 1, user_id: 1, name: 'Test Farm', location: 'Test Location' }]));
    mockFarmService.getFields.and.returnValue(of([{ id: 1, farm_id: 1, name: 'Test Field', area_hectares: 10 }]));
    mockFarmService.getEvents.and.returnValue(of([{ id: 1, field_id: 1, event_type: 'Test Event', description: 'Test', date: '2024-01-01' }]));

    await TestBed.configureTestingModule({
      imports: [FarmManagementComponent],
      providers: [
        { provide: FarmManagementService, useValue: mockFarmService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(mockFarmService.getFarms).toHaveBeenCalled();
    expect(mockFarmService.getFields).toHaveBeenCalled();
    expect(mockFarmService.getEvents).toHaveBeenCalled();
  });
});
