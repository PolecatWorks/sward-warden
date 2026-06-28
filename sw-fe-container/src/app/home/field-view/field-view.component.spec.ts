import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { FieldViewComponent } from './field-view.component';
import { FarmManagementService } from '../../services/farm-management.service';

// PRD Reference: 0016
describe('FieldViewComponent', () => {
  let component: FieldViewComponent;
  let fixture: ComponentFixture<FieldViewComponent>;

  // PRD Reference: 0016
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        // PRD Reference: 0016
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'fieldId' ? '1' : null),
            }),
          },
        },
        {
          provide: FarmManagementService,
          useValue: {
            getField: () =>
              of({
                id: 1,
                farm_id: 1,
                name: 'Test Field',
                area_hectares: 10,
                land_use: 'grassland',
              }),
            getFarms: () =>
              of([
                { id: 1, name: 'Test Farm' },
                { id: 2, name: 'Other Farm' },
              ]),
            updateField: () =>
              of({
                id: 1,
                farm_id: 2,
                name: 'Updated Name',
                area_hectares: 12.5,
                land_use: 'arable',
              }),
            getEvents: () => of([]),
            getFertiliserApplications: () => of([]),
            getOrganicManureApplications: () => of([]),
            addEvent: () => of({}),
            addFertiliserApplication: () => of({}),
            addOrganicManureApplication: () => of({}),
            updateEvent: () => of({}),
            updateFertiliserApplication: () => of({}),
            updateOrganicManureApplication: () => of({}),
          },
        },
      ],
      imports: [
        FieldViewComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0016
  it('should create', () => {
    // PRD Reference: 0016
    expect(component).toBeTruthy();
  });

  // PRD Reference: 0016
  it('should initialize editing form fields when opening edit modal', () => {
    component.openEditFieldModal();
    // PRD Reference: 0016
    expect(component.showEditFieldModal).toBeTrue();
    // PRD Reference: 0016
    expect(component.editFieldName).toBe('Test Field');
    // PRD Reference: 0016
    expect(component.editFieldArea).toBe(10);
    // PRD Reference: 0016
    expect(component.editFieldLandUse).toBe('grassland');
    // PRD Reference: 0016
    expect(component.editFieldFarmId).toBe(1);
  });

  // PRD Reference: 0016
  it('should reset editing state when closing edit modal', () => {
    component.openEditFieldModal();
    component.closeEditFieldModal();
    // PRD Reference: 0016
    expect(component.showEditFieldModal).toBeFalse();
    // PRD Reference: 0016
    expect(component.editFieldName).toBe('');
    // PRD Reference: 0016
    expect(component.editFieldArea).toBe(0);
    // PRD Reference: 0016
    expect(component.editFieldFarmId).toBe(0);
  });

  // PRD Reference: 0016
  it('should call updateField and refresh details on submit', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0016
    spyOn(farmService, 'updateField').and.callThrough();
    // PRD Reference: 0016
    spyOn(component, 'loadFieldDetails').and.callThrough();

    component.openEditFieldModal();
    component.editFieldName = 'Updated Name';
    component.editFieldArea = 12.5;
    component.editFieldLandUse = 'arable';
    component.editFieldFarmId = 2;

    component.editField();

    // PRD Reference: 0016
    expect(farmService.updateField).toHaveBeenCalledWith(1, {
      name: 'Updated Name',
      area_hectares: 12.5,
      land_use: 'arable',
      farm_id: 2,
      geometry_geojson: undefined
    });
    // PRD Reference: 0016
    expect(component.loadFieldDetails).toHaveBeenCalled();
    // PRD Reference: 0016
    expect(component.showEditFieldModal).toBeFalse();
  });

  // PRD Reference: 0016
  it('should toggle planting form and general event form', () => {
    // PRD Reference: 0016
    expect(component.showPlantingForm).toBeFalse();
    component.togglePlantingForm();
    // PRD Reference: 0016
    expect(component.showPlantingForm).toBeTrue();
    component.togglePlantingForm();
    // PRD Reference: 0016
    expect(component.showPlantingForm).toBeFalse();

    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    component.toggleGeneralEventForm();
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeTrue();
    component.toggleGeneralEventForm();
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
  });

  // PRD Reference: 0016
  it('should route general event type change to correct sub-modal', () => {
    component.showGeneralEventForm = true;
    component.showPlantingForm = false;
    component.onGeneralEventTypeChange('Planting');
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.showPlantingForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showFertiliserForm = false;
    component.onGeneralEventTypeChange('Fertiliser');
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.showFertiliserForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showSprayingForm = false;
    component.onGeneralEventTypeChange('Spraying');
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.showSprayingForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showOrganicManureForm = false;
    component.onGeneralEventTypeChange('Organic Manure');
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.showOrganicManureForm).toBeTrue();
  });

  // PRD Reference: 0016
  it('should submit planting record and reload events', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0016
    spyOn(farmService, 'addEvent').and.callThrough();
    // PRD Reference: 0016
    spyOn(component, 'loadEvents').and.callThrough();

    component.showPlantingForm = true;
    component.newPlanting = {
      date: '2026-06-08',
      crop: 'Barley',
      variety: 'Golden',
      description: 'Test planting description',
    };

    component.submitPlantingRecord();

    // PRD Reference: 0016
    expect(farmService.addEvent).toHaveBeenCalledWith({
      field_id: component.fieldId,
      event_type: 'Planting',
      description: 'Test planting description',
      date: '2026-06-08',
      mapp_number: 'Barley',
      eppo_code: 'Golden',
    } as any);
    // PRD Reference: 0016
    expect(component.loadEvents).toHaveBeenCalled();
    // PRD Reference: 0016
    expect(component.showPlantingForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.newPlanting.crop).toBe('');
  });

  // PRD Reference: 0016
  it('should parse crop and variety from description when editing legacy planting events', () => {
    const legacyEvent: any = {
      id: 101,
      field_id: 1,
      event_type: 'Planting',
      description: 'Planted Wheat (Variety: Winter Wheat)',
      date: '2026-06-08',
    };

    component.startEdit(legacyEvent);

    // PRD Reference: 0016
    expect(component.editingEventId).toBe(101);
    // PRD Reference: 0016
    expect(component.editFormData.mapp_number).toBe('Wheat');
    // PRD Reference: 0016
    expect(component.editFormData.eppo_code).toBe('Winter Wheat');
    // PRD Reference: 0016
    expect(component.editFormData.description).toBe('');
  });

  // PRD Reference: 0016
  it('should save edited planting fields successfully', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0016
    spyOn(farmService, 'updateEvent').and.callThrough();
    // PRD Reference: 0016
    spyOn(component, 'loadEvents').and.callThrough();

    const plantingEvent: any = {
      id: 102,
      field_id: 1,
      event_type: 'Planting',
      description: 'Original Notes',
      date: '2026-06-08',
      mapp_number: 'Oats',
      eppo_code: 'Oat Variety',
    };

    component.startEdit(plantingEvent);
    component.editFormData.mapp_number = 'Rye';
    component.editFormData.eppo_code = 'Rye Variety';
    component.editFormData.description = 'New Notes';

    component.saveEdit(plantingEvent);

    // PRD Reference: 0016
    expect(farmService.updateEvent).toHaveBeenCalledWith('102', {
      description: 'New Notes',
      date: '2026-06-08',
      mapp_number: 'Rye',
      eppo_code: 'Rye Variety',
      bbch_growth_stage: undefined,
    });
    // PRD Reference: 0016
    expect(component.loadEvents).toHaveBeenCalled();
  });

  // PRD Reference: 0016
  it('should submit general event and reload events', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0016
    spyOn(farmService, 'addEvent').and.callThrough();
    // PRD Reference: 0016
    spyOn(component, 'loadEvents').and.callThrough();

    component.showGeneralEventForm = true;
    component.generalEvent = {
      event_type: 'Harvesting',
      date: '2026-06-08',
      description: 'Harvesting the field',
    };

    component.submitGeneralEvent();

    // PRD Reference: 0016
    expect(farmService.addEvent).toHaveBeenCalledWith({
      field_id: component.fieldId,
      event_type: 'Harvesting',
      description: 'Harvesting the field',
      date: '2026-06-08',
    } as any);
    // PRD Reference: 0016
    expect(component.loadEvents).toHaveBeenCalled();
    // PRD Reference: 0016
    expect(component.showGeneralEventForm).toBeFalse();
    // PRD Reference: 0016
    expect(component.generalEvent.event_type).toBe('');
  });

  // PRD Reference: 0016
  it('should immediately apply error visual classes to empty required fields in planting form', async () => {
    component.showPlantingForm = true;
    component.newPlanting.crop = '';
    component.newPlanting.variety = '';
    fixture.detectChanges();
    await fixture.whenStable();

    const cropInput = fixture.nativeElement.querySelector('input[name="crop"]');
    const varietyInput = fixture.nativeElement.querySelector(
      'input[name="variety"]',
    );

    // PRD Reference: 0016
    expect(cropInput).toBeTruthy();
    // PRD Reference: 0016
    expect(cropInput.className).toContain('border-error');
    // PRD Reference: 0016
    expect(varietyInput).toBeTruthy();
    // PRD Reference: 0016
    expect(varietyInput.className).toContain('border-error');
  });
});
