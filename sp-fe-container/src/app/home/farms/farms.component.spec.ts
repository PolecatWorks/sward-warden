import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { FarmsComponent } from './farms.component';
import { FarmManagementService } from '../../services/farm-management.service';
import { Farm } from '../../models/farm';

const mockFarms: Farm[] = [
  { id: 1, user_id: 1, name: 'Sunrise Farm', location: 'Kerry, Ireland' },
  { id: 2, user_id: 1, name: 'Millbrook Farm', location: 'Cork, Ireland' },
];

describe('FarmsComponent', () => {
  let component: FarmsComponent;
  let fixture: ComponentFixture<FarmsComponent>;
  let farmServiceSpy: jasmine.SpyObj<FarmManagementService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FarmManagementService', [
      'getFarms',
      'addFarm',
      'deleteFarm',
    ]);
    spy.getFarms.and.returnValue(of(mockFarms));
    spy.addFarm.and.returnValue(of({ id: 3, name: 'New Farm', location: 'Galway, Ireland' }));
    spy.deleteFarm.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: FarmManagementService, useValue: spy },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [FarmsComponent],
    }).compileComponents();

    farmServiceSpy = TestBed.inject(FarmManagementService) as jasmine.SpyObj<FarmManagementService>;
    fixture = TestBed.createComponent(FarmsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── Load Farms ────────────────────────────────────────────
  describe('ngOnInit / loadFarms', () => {
    it('should call getFarms on init and populate farms list', () => {
      fixture.detectChanges();
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(1);
      expect(component.farms).toEqual(mockFarms);
    });

    it('should set isLoading to false after farms are loaded', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('should display farm cards for each farm returned', () => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('[data-testid^="farm-card-"]');
      expect(cards.length).toBe(2);
    });

    it('should show empty state when no farms are returned', () => {
      farmServiceSpy.getFarms.and.returnValue(of([]));
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
    });

    it('should show error banner when getFarms fails', () => {
      spyOn(console, 'error');
      farmServiceSpy.getFarms.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(component.errorMessage).toContain('Failed to load farms');
      expect(component.isLoading).toBeFalse();
    });

    it('should not show empty state while loading', () => {
      // Set isLoading manually to verify template hides list during load
      component.isLoading = true;
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
      // The whole list div is hidden by *ngIf="!isLoading", so empty-state is also hidden
      expect(emptyState).toBeNull();
    });
  });

  // ── Open / Close Modal ────────────────────────────────────
  describe('openAddFarmModal / closeAddFarmModal', () => {
    it('should open the modal when openAddFarmModal is called', () => {
      fixture.detectChanges();
      component.openAddFarmModal();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal).toBeTruthy();
    });

    it('should close the modal when closeAddFarmModal is called', () => {
      component.showAddFarmModal = true;
      fixture.detectChanges();
      component.closeAddFarmModal();
      fixture.detectChanges();
      const modal = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(modal).toBeNull();
    });

    it('should reset form fields when modal is closed', () => {
      component.newFarmName = 'Test';
      component.newFarmLocation = 'Somewhere';
      component.closeAddFarmModal();
      expect(component.newFarmName).toBe('');
      expect(component.newFarmLocation).toBe('');
    });

    it('should reset form fields when modal is opened', () => {
      component.newFarmName = 'OldName';
      component.newFarmLocation = 'OldLocation';
      component.openAddFarmModal();
      expect(component.newFarmName).toBe('');
      expect(component.newFarmLocation).toBe('');
    });
  });

  // ── Add Farm ──────────────────────────────────────────────
  describe('addFarm', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.openAddFarmModal();
    });

    it('should call addFarm service with name and location only (no client id)', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();

      expect(farmServiceSpy.addFarm).toHaveBeenCalledOnceWith({
        name: 'New Farm',
        location: 'Galway, Ireland',
      });
      // Crucially: no 'id' field sent to server
      const callArg = farmServiceSpy.addFarm.calls.mostRecent().args[0];
      expect(callArg.id).toBeUndefined();
    });

    it('should reload farms after a successful add', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      // getFarms is called once on init, once after add
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(2);
    });

    it('should close modal and clear inputs after successful add', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      expect(component.showAddFarmModal).toBeFalse();
      expect(component.newFarmName).toBe('');
      expect(component.newFarmLocation).toBe('');
    });

    it('should not call addFarm service if name is empty', () => {
      component.newFarmName = '';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      expect(farmServiceSpy.addFarm).not.toHaveBeenCalled();
    });

    it('should not call addFarm service if location is empty', () => {
      component.newFarmName = 'New Farm';
      component.newFarmLocation = '';
      component.addFarm();
      expect(farmServiceSpy.addFarm).not.toHaveBeenCalled();
    });

    it('should set errorMessage if addFarm fails', () => {
      spyOn(console, 'error');
      farmServiceSpy.addFarm.and.returnValue(throwError(() => new Error('Server error')));
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      expect(component.errorMessage).toContain('Failed to add farm');
      expect(component.isSaving).toBeFalse();
    });
  });

  // ── Delete Farm ───────────────────────────────────────────
  describe('deleteFarm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call deleteFarm service with the correct farm id', () => {
      component.deleteFarm(1);
      expect(farmServiceSpy.deleteFarm).toHaveBeenCalledOnceWith(1);
    });

    it('should reload farms after successful delete', () => {
      component.deleteFarm(1);
      // init call + post-delete call
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(2);
    });

    it('should show error message when delete fails', () => {
      spyOn(console, 'error');
      farmServiceSpy.deleteFarm.and.returnValue(throwError(() => new Error('Delete failed')));
      component.deleteFarm(1);
      expect(component.errorMessage).toContain('Failed to delete farm');
    });
  });
});
