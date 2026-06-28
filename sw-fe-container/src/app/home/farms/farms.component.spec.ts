import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { FarmsComponent } from './farms.component';
import { FarmManagementService } from '../../services/farm-management.service';
import { LoggerService } from '../../services/logger.service';
import { Farm } from '../../models/farm';
import { Field } from '../../models/field';
import { Event as FarmEvent } from '../../models/event';

const mockFarms: Farm[] = [
  { id: 1, user_id: 1, name: 'Sunrise Farm', location: 'Kerry, Ireland' },
  { id: 2, user_id: 1, name: 'Millbrook Farm', location: 'Cork, Ireland' },
];

// PRD Reference: 0003
describe('FarmsComponent', () => {
  let component: FarmsComponent;
  let fixture: ComponentFixture<FarmsComponent>;
  let farmServiceSpy: jasmine.SpyObj<FarmManagementService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  // PRD Reference: 0003
  beforeEach(async () => {
    const loggerSpy = jasmine.createSpyObj('LoggerService', [
      'log',
      'info',
      'warn',
      'error',
    ]);
    const spy = jasmine.createSpyObj('FarmManagementService', [
      'getFarms',
      'getFields',
      'getEvents',
      'addFarm',
      'updateFarm',
      'deleteEntity',
    ]);
    spy.getFarms.and.returnValue(of(mockFarms));
    spy.getFields.and.returnValue(of([]));
    spy.getEvents.and.returnValue(of([]));
    spy.addFarm.and.returnValue(
      of({ id: 3, name: 'New Farm', location: 'Galway, Ireland' }),
    );
    spy.updateFarm.and.returnValue(
      of({ id: 1, name: 'Updated Farm', location: 'Kerry, Ireland' }),
    );
    spy.deleteEntity.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: FarmManagementService, useValue: spy },
        { provide: LoggerService, useValue: loggerSpy },
        // PRD Reference: 0003
        provideRouter([]),
        // PRD Reference: 0003
        provideHttpClient(),
        // PRD Reference: 0003
        provideHttpClientTesting(),
      ],
      imports: [FarmsComponent],
    }).compileComponents();

    farmServiceSpy = TestBed.inject(
      FarmManagementService,
    ) as jasmine.SpyObj<FarmManagementService>;
    loggerServiceSpy = TestBed.inject(
      LoggerService,
    ) as jasmine.SpyObj<LoggerService>;
    fixture = TestBed.createComponent(FarmsComponent);
    component = fixture.componentInstance;
  });

  // PRD Reference: 0003
  it('should create', () => {
    fixture.detectChanges();
    // PRD Reference: 0003
    expect(component).toBeTruthy();
  });

  // ── Load Farms ────────────────────────────────────────────
  // PRD Reference: 0003
  describe('ngOnInit / loadFarms', () => {
    // PRD Reference: 0003
    it('should call getFarms on init and populate farms list', () => {
      fixture.detectChanges();
      // PRD Reference: 0003
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(1);
      // PRD Reference: 0003
      expect(component.farms).toEqual(mockFarms);
    });

    // PRD Reference: 0003
    it('should set isLoading to false after farms are loaded', () => {
      fixture.detectChanges();
      // PRD Reference: 0003
      expect(component.isLoading).toBeFalse();
    });

    // PRD Reference: 0003
    it('should display farm cards for each farm returned', () => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll(
        '[data-testid^="farm-card-"]',
      );
      // PRD Reference: 0003
      expect(cards.length).toBe(2);
    });

    // PRD Reference: 0003
    it('should show empty state when no farms are returned', () => {
      farmServiceSpy.getFarms.and.returnValue(of([]));
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector(
        '[data-testid="empty-state"]',
      );
      // PRD Reference: 0003
      expect(emptyState).toBeTruthy();
    });

    // PRD Reference: 0003
    it('should show error banner when getFarms fails', () => {
      farmServiceSpy.getFarms.and.returnValue(
        throwError(() => new Error('Network error')),
      );
      fixture.detectChanges();
      // PRD Reference: 0003
      expect(component.errorMessage).toContain(
        'Failed to load data. Please try again.',
      );
      // PRD Reference: 0003
      expect(component.isLoading).toBeFalse();
    });

    // PRD Reference: 0003
    it('should not show empty state while loading', () => {
      // Set isLoading manually to verify template hides list during load
      component.isLoading = true;
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector(
        '[data-testid="empty-state"]',
      );
      // The whole list div is hidden by *ngIf="!isLoading", so empty-state is also hidden
      // PRD Reference: 0003
      expect(emptyState).toBeNull();
    });
  });

  // ── Open / Close Modal ────────────────────────────────────
  // PRD Reference: 0003
  describe('openAddFarmModal / closeAddFarmModal', () => {
    // PRD Reference: 0003
    it('should open the modal when openAddFarmModal is called', () => {
      fixture.detectChanges();
      component.openAddFarmModal();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      // PRD Reference: 0003
      expect(modal).toBeTruthy();
    });

    // PRD Reference: 0003
    it('should close the modal when closeAddFarmModal is called', () => {
      component.showAddFarmModal = true;
      fixture.detectChanges();
      component.closeAddFarmModal();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      // PRD Reference: 0003
      expect(modal).toBeNull();
    });

    // PRD Reference: 0003
    it('should reset form fields when modal is closed', () => {
      component.newFarmName = 'Test';
      component.newFarmLocation = 'Somewhere';
      component.closeAddFarmModal();
      // PRD Reference: 0003
      expect(component.newFarmName).toBe('');
      // PRD Reference: 0003
      expect(component.newFarmLocation).toBe('');
    });

    // PRD Reference: 0003
    it('should reset form fields when modal is opened', () => {
      component.newFarmName = 'OldName';
      component.newFarmLocation = 'OldLocation';
      component.openAddFarmModal();
      // PRD Reference: 0003
      expect(component.newFarmName).toBe('');
      // PRD Reference: 0003
      expect(component.newFarmLocation).toBe('');
    });
  });

  // ── Add Farm ──────────────────────────────────────────────
  // PRD Reference: 0003
  describe('addFarm', () => {
    // PRD Reference: 0003
    beforeEach(() => {
      fixture.detectChanges();
      component.openAddFarmModal();
    });

    // PRD Reference: 0003
    it('should call addFarm service with name and location only (no client id)', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();

      // PRD Reference: 0003
      expect(farmServiceSpy.addFarm).toHaveBeenCalledOnceWith({
        name: 'New Farm',
        location: 'Galway, Ireland',
      });
      // Crucially: no 'id' field sent to server
      const callArg = farmServiceSpy.addFarm.calls.mostRecent().args[0];
      // PRD Reference: 0003
      expect(callArg.id).toBeUndefined();
    });

    // PRD Reference: 0003
    it('should reload farms after a successful add', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      // getFarms is called once on init, once after add
      // PRD Reference: 0003
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(2);
    });

    // PRD Reference: 0003
    it('should close modal and clear inputs after successful add', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      // PRD Reference: 0003
      expect(component.showAddFarmModal).toBeFalse();
      // PRD Reference: 0003
      expect(component.newFarmName).toBe('');
      // PRD Reference: 0003
      expect(component.newFarmLocation).toBe('');
    });

    // PRD Reference: 0003
    it('should not call addFarm service if name is empty', () => {
      component.newFarmName = '';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      // PRD Reference: 0003
      expect(farmServiceSpy.addFarm).not.toHaveBeenCalled();
    });

    // PRD Reference: 0003
    it('should not call addFarm service if location is empty', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = '';
      component.addFarm();
      // PRD Reference: 0003
      expect(farmServiceSpy.addFarm).not.toHaveBeenCalled();
    });

    // PRD Reference: 0003
    it('should set errorMessage if addFarm fails', () => {
      farmServiceSpy.addFarm.and.returnValue(
        throwError(() => new Error('Server error')),
      );
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      // PRD Reference: 0003
      expect(component.errorMessage).toContain('Failed to add farm');
      // PRD Reference: 0003
      expect(component.isSaving).toBeFalse();
    });
  });
});
