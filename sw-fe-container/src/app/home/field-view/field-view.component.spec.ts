import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { FieldViewComponent } from './field-view.component';
import { FarmManagementService } from '../../services/farm-management.service';

describe('FieldViewComponent', () => {
  let component: FieldViewComponent;
  let fixture: ComponentFixture<FieldViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => key === 'fieldId' ? '1' : null
            })
          }
        },
        {
          provide: FarmManagementService,
          useValue: {
            getField: () => of({ id: 1, farm_id: 1, name: 'Test Field', area_hectares: 10, land_use: 'grassland' }),
            getFarms: () => of([{ id: 1, name: 'Test Farm' }, { id: 2, name: 'Other Farm' }]),
            updateField: () => of({ id: 1, farm_id: 2, name: 'Updated Name', area_hectares: 12.5, land_use: 'arable' }),
            getEvents: () => of([]),
            getFertiliserApplications: () => of([]),
            getOrganicManureApplications: () => of([]),
            addEvent: () => of({}),
            addFertiliserApplication: () => of({}),
            addOrganicManureApplication: () => of({}),
            updateEvent: () => of({}),
            updateFertiliserApplication: () => of({}),
            updateOrganicManureApplication: () => of({})
          }
        }
      ],
      imports: [FieldViewComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize editing form fields when opening edit modal', () => {
    component.openEditFieldModal();
    expect(component.showEditFieldModal).toBeTrue();
    expect(component.editFieldName).toBe('Test Field');
    expect(component.editFieldArea).toBe(10);
    expect(component.editFieldLandUse).toBe('grassland');
    expect(component.editFieldFarmId).toBe(1);
  });

  it('should reset editing state when closing edit modal', () => {
    component.openEditFieldModal();
    component.closeEditFieldModal();
    expect(component.showEditFieldModal).toBeFalse();
    expect(component.editFieldName).toBe('');
    expect(component.editFieldArea).toBe(0);
    expect(component.editFieldFarmId).toBe(0);
  });

  it('should call updateField and refresh details on submit', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'updateField').and.callThrough();
    spyOn(component, 'loadFieldDetails').and.callThrough();

    component.openEditFieldModal();
    component.editFieldName = 'Updated Name';
    component.editFieldArea = 12.5;
    component.editFieldLandUse = 'arable';
    component.editFieldFarmId = 2;

    component.editField();

    expect(farmService.updateField).toHaveBeenCalledWith(1, {
      name: 'Updated Name',
      area_hectares: 12.5,
      land_use: 'arable',
      farm_id: 2
    });
    expect(component.loadFieldDetails).toHaveBeenCalled();
    expect(component.showEditFieldModal).toBeFalse();
  });

  it('should toggle planting form and general event form', () => {
    expect(component.showPlantingForm).toBeFalse();
    component.togglePlantingForm();
    expect(component.showPlantingForm).toBeTrue();
    component.togglePlantingForm();
    expect(component.showPlantingForm).toBeFalse();

    expect(component.showGeneralEventForm).toBeFalse();
    component.toggleGeneralEventForm();
    expect(component.showGeneralEventForm).toBeTrue();
    component.toggleGeneralEventForm();
    expect(component.showGeneralEventForm).toBeFalse();
  });

  it('should route general event type change to correct sub-modal', () => {
    component.showGeneralEventForm = true;
    component.showPlantingForm = false;
    component.onGeneralEventTypeChange('Planting');
    expect(component.showGeneralEventForm).toBeFalse();
    expect(component.showPlantingForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showFertiliserForm = false;
    component.onGeneralEventTypeChange('Fertiliser');
    expect(component.showGeneralEventForm).toBeFalse();
    expect(component.showFertiliserForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showSprayingForm = false;
    component.onGeneralEventTypeChange('Spraying');
    expect(component.showGeneralEventForm).toBeFalse();
    expect(component.showSprayingForm).toBeTrue();

    component.showGeneralEventForm = true;
    component.showOrganicManureForm = false;
    component.onGeneralEventTypeChange('Organic Manure');
    expect(component.showGeneralEventForm).toBeFalse();
    expect(component.showOrganicManureForm).toBeTrue();
  });

  it('should submit planting record and reload events', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'addEvent').and.callThrough();
    spyOn(component, 'loadEvents').and.callThrough();

    component.showPlantingForm = true;
    component.newPlanting = {
      date: '2026-06-08',
      crop: 'Barley',
      variety: 'Golden',
      description: 'Test planting description'
    };

    component.submitPlantingRecord();

    expect(farmService.addEvent).toHaveBeenCalledWith({
      field_id: component.fieldId,
      event_type: 'Planting',
      description: 'Test planting description',
      date: '2026-06-08',
      mapp_number: 'Barley',
      eppo_code: 'Golden'
    } as any);
    expect(component.loadEvents).toHaveBeenCalled();
    expect(component.showPlantingForm).toBeFalse();
    expect(component.newPlanting.crop).toBe('');
  });

  it('should parse crop and variety from description when editing legacy planting events', () => {
    const legacyEvent: any = {
      id: 101,
      field_id: 1,
      event_type: 'Planting',
      description: 'Planted Wheat (Variety: Winter Wheat)',
      date: '2026-06-08'
    };

    component.startEdit(legacyEvent);

    expect(component.editingEventId).toBe(101);
    expect(component.editFormData.mapp_number).toBe('Wheat');
    expect(component.editFormData.eppo_code).toBe('Winter Wheat');
    expect(component.editFormData.description).toBe('');
  });

  it('should save edited planting fields successfully', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'updateEvent').and.callThrough();
    spyOn(component, 'loadEvents').and.callThrough();

    const plantingEvent: any = {
      id: 102,
      field_id: 1,
      event_type: 'Planting',
      description: 'Original Notes',
      date: '2026-06-08',
      mapp_number: 'Oats',
      eppo_code: 'Oat Variety'
    };

    component.startEdit(plantingEvent);
    component.editFormData.mapp_number = 'Rye';
    component.editFormData.eppo_code = 'Rye Variety';
    component.editFormData.description = 'New Notes';

    component.saveEdit(plantingEvent);

    expect(farmService.updateEvent).toHaveBeenCalledWith('102', {
      description: 'New Notes',
      date: '2026-06-08',
      mapp_number: 'Rye',
      eppo_code: 'Rye Variety',
      bbch_growth_stage: undefined
    });
    expect(component.loadEvents).toHaveBeenCalled();
  });

  it('should submit general event and reload events', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'addEvent').and.callThrough();
    spyOn(component, 'loadEvents').and.callThrough();

    component.showGeneralEventForm = true;
    component.generalEvent = {
      event_type: 'Harvesting',
      date: '2026-06-08',
      description: 'Harvesting the field'
    };

    component.submitGeneralEvent();

    expect(farmService.addEvent).toHaveBeenCalledWith({
      field_id: component.fieldId,
      event_type: 'Harvesting',
      description: 'Harvesting the field',
      date: '2026-06-08'
    } as any);
    expect(component.loadEvents).toHaveBeenCalled();
    expect(component.showGeneralEventForm).toBeFalse();
    expect(component.generalEvent.event_type).toBe('');
  });

  it('should immediately apply error visual classes to empty required fields in planting form', async () => {
    component.showPlantingForm = true;
    component.newPlanting.crop = '';
    component.newPlanting.variety = '';
    fixture.detectChanges();
    await fixture.whenStable();

    const cropInput = fixture.nativeElement.querySelector('input[name="crop"]');
    const varietyInput = fixture.nativeElement.querySelector('input[name="variety"]');

    expect(cropInput).toBeTruthy();
    expect(cropInput.className).toContain('border-error');
    expect(varietyInput).toBeTruthy();
    expect(varietyInput.className).toContain('border-error');
  });
});
