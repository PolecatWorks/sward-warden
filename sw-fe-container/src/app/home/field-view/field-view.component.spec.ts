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
});
