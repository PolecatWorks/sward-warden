import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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

describe('FarmsComponent', () => {
  let component: FarmsComponent;
  let fixture: ComponentFixture<FarmsComponent>;
  let farmServiceSpy: jasmine.SpyObj<FarmManagementService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'info', 'warn', 'error']);
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
    spy.addFarm.and.returnValue(of({ id: 3, name: 'New Farm', location: 'Galway, Ireland' }));
    spy.updateFarm.and.returnValue(of({ id: 1, name: 'Updated Farm', location: 'Kerry, Ireland' }));
    spy.deleteEntity.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: FarmManagementService, useValue: spy },
        { provide: LoggerService, useValue: loggerSpy },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [FarmsComponent],
    }).compileComponents();

    farmServiceSpy = TestBed.inject(FarmManagementService) as jasmine.SpyObj<FarmManagementService>;
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
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
      component.selectedView = 'farms';
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
      farmServiceSpy.getFarms.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(component.errorMessage).toContain('Failed to load data. Please try again.');
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
      farmServiceSpy.addFarm.and.returnValue(throwError(() => new Error('Server error')));
      component.newFarmName = 'New Farm';
      component.newFarmLocation = 'Galway, Ireland';
      component.addFarm();
      expect(component.errorMessage).toContain('Failed to add farm');
      expect(component.isSaving).toBeFalse();
    });
  });

  // ── Delete Farm ───────────────────────────────────────────
  describe('deleteEntity', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call deleteEntity service with the correct farm id', () => {
      component.deleteFarm(1);
      expect(farmServiceSpy.deleteEntity).toHaveBeenCalledOnceWith('farms', 1);
    });

    it('should reload farms after successful delete', () => {
      component.deleteFarm(1);
      // init call + post-delete call
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(2);
    });

    it('should show error message when delete fails', () => {
      farmServiceSpy.deleteEntity.and.returnValue(throwError(() => new Error('Delete failed')));
      component.deleteFarm(1);
      expect(component.errorMessage).toContain('Failed to delete farm');
    });
  });

  // ── Edit Farm ──────────────────────────────────────────────
  describe('editFarm', () => {
    beforeEach(() => {
      fixture.detectChanges();
      farmServiceSpy.updateFarm.and.returnValue(of({ id: 1, name: 'Updated Farm', location: 'Kerry, Ireland' }));
    });

    it('should open edit modal and prefill inputs', () => {
      const farmToEdit = mockFarms[0];
      const dummyEvent = new Event('click');
      component.openEditFarmModal(farmToEdit, dummyEvent);
      expect(component.showEditFarmModal).toBeTrue();
      expect(component.editingFarm).toEqual(farmToEdit);
      expect(component.editFarmName).toBe(farmToEdit.name);
      expect(component.editFarmLocation).toBe(farmToEdit.location);
    });

    it('should call updateFarm service with correct parameters and reload farms', () => {
      const farmToEdit = mockFarms[0];
      const dummyEvent = new Event('click');
      component.openEditFarmModal(farmToEdit, dummyEvent);
      component.editFarmName = 'Truly Updated Farm';
      component.editFarmLocation = 'New Location';
      component.editFarm();

      expect(farmServiceSpy.updateFarm).toHaveBeenCalledOnceWith(1, {
        name: 'Truly Updated Farm',
        location: 'New Location',
      });
      expect(farmServiceSpy.getFarms).toHaveBeenCalledTimes(2);
      expect(component.showEditFarmModal).toBeFalse();
    });

    it('should show error message when updateFarm fails', () => {
      farmServiceSpy.updateFarm.and.returnValue(throwError(() => new Error('Update failed')));
      const farmToEdit = mockFarms[0];
      const dummyEvent = new Event('click');
      component.openEditFarmModal(farmToEdit, dummyEvent);
      component.editFarm();

      expect(component.errorMessage).toContain('Failed to update farm');
      expect(component.isSaving).toBeFalse();
    });
  });

  // ── Fields-First UX ──────────────────────────────────────────
  describe('Fields-First UX', () => {
    const mockFields: Field[] = [
      { id: 10, farm_id: 1, name: 'North Meadow', area_hectares: 15.5, land_use: 'Silage' },
      { id: 20, farm_id: 2, name: 'South Slope', area_hectares: 10.0, land_use: 'Barley' }
    ];
    const mockEvents: FarmEvent[] = [
      { id: 100, field_id: 10, event_type: 'Planting', description: 'Planted grass silage', date: '2026-05-01' },
      { id: 200, field_id: 20, event_type: 'Spraying', description: 'Sprayed herbicides', date: '2026-05-15' }
    ];

    beforeEach(() => {
      farmServiceSpy.getFarms.and.returnValue(of(mockFarms));
      farmServiceSpy.getFields.and.returnValue(of(mockFields));
      farmServiceSpy.getEvents.and.returnValue(of(mockEvents));
    });

    it('should default to fields view on init', () => {
      fixture.detectChanges();
      expect(component.selectedView).toBe('fields');
      const fieldsList = fixture.nativeElement.querySelector('[data-testid="fields-list"]');
      const farmsList = fixture.nativeElement.querySelector('[data-testid="farms-list"]');
      expect(fieldsList).toBeTruthy();
      expect(farmsList).toBeFalsy();
    });

    it('should render all fields in a flat list with correct details', () => {
      fixture.detectChanges();
      const fieldCards = fixture.nativeElement.querySelectorAll('[data-testid^="field-card-"]');
      expect(fieldCards.length).toBe(2);

      const firstCardName = fieldCards[0].querySelector('[data-testid="field-name"]').textContent.trim();
      expect(firstCardName).toContain('North Meadow');

      const firstCardArea = fieldCards[0].querySelector('[data-testid="field-area"]').textContent.trim();
      expect(firstCardArea).toContain('15.5');

      const firstCardLanduse = fieldCards[0].querySelector('[data-testid="field-landuse"]').textContent.trim();
      expect(firstCardLanduse).toContain('Crop: Silage');

      const firstCardActivity = fieldCards[0].querySelector('[data-testid="field-activity"]').textContent.trim();
      expect(firstCardActivity).toBe('2026-05-01');
    });

    it('should show the associated farm name for multi-farm users', () => {
      fixture.detectChanges();
      const fieldCards = fixture.nativeElement.querySelectorAll('[data-testid^="field-card-"]');
      const firstCardFarm = fieldCards[0].querySelector('[data-testid="field-farm"]').textContent.trim();
      expect(firstCardFarm).toContain('Farm: Sunrise Farm');
    });

    it('should toggle view to farms when farms tab is clicked', () => {
      fixture.detectChanges();
      const farmsTab = fixture.nativeElement.querySelector('[data-testid="farms-tab"]');
      expect(farmsTab).toBeTruthy();

      farmsTab.click();
      fixture.detectChanges();

      expect(component.selectedView).toBe('farms');
      const fieldsList = fixture.nativeElement.querySelector('[data-testid="fields-list"]');
      const farmsList = fixture.nativeElement.querySelector('[data-testid="farms-list"]');
      expect(fieldsList).toBeFalsy();
      expect(farmsList).toBeTruthy();
    });

    it('should apply single farm optimization when user has exactly 1 farm', () => {
      const singleFarm: Farm[] = [
        { id: 1, user_id: 1, name: 'Solo Pasture', location: 'Antrim, UK' }
      ];
      const singleFarmFields: Field[] = [
        { id: 10, farm_id: 1, name: 'Lone Acre', area_hectares: 5.0, land_use: 'Wheat' }
      ];

      farmServiceSpy.getFarms.and.returnValue(of(singleFarm));
      farmServiceSpy.getFields.and.returnValue(of(singleFarmFields));

      fixture.detectChanges();

      // Farms tab should be hidden
      const farmsTab = fixture.nativeElement.querySelector('[data-testid="farms-tab"]');
      expect(farmsTab).toBeNull();

      // Farm column/indicator should be hidden
      const fieldCards = fixture.nativeElement.querySelectorAll('[data-testid^="field-card-"]');
      expect(fieldCards.length).toBe(1);
      const farmIndicator = fieldCards[0].querySelector('[data-testid="field-farm"]');
      expect(farmIndicator).toBeNull();
    });
  });
});
