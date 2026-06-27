import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';

import { FieldsComponent } from './fields.component';
import { FarmManagementService } from '../../services/farm-management.service';
import { RxdbService } from '../../services/rxdb/rxdb.service';
import { AuthService } from '../../services/auth.service';
import { SyncEngineService } from '../../services/sync-engine.service';

describe('FieldsComponent', () => {
  let component: FieldsComponent;
  let fixture: ComponentFixture<FieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => key === 'farmId' ? '1' : null
            })
          }
        },
        {
          provide: RxdbService,
          useValue: {
            fallbackToRest$: new BehaviorSubject<boolean>(false)
          }
        },
        {
          provide: FarmManagementService,
          useValue: {
            getFields: () => of([]),
            getFarms: () => of([{ id: 1, name: 'Sunrise Farm', location: 'Kerry, Ireland' }]),
            getUser: () => of({ id: 1, name: 'Test User' }),
            addFarm: () => of({ id: 2 }),
            addField: () => of({}),
            deleteEntity: () => of({}),
            updateField: () => of({}),
            updateFarm: () => of({ id: 1, name: 'Updated Farm', location: 'New Location' })
          }
        },
        {
          provide: AuthService,
          useValue: {
            getUserId: () => '1'
          }
        },
        {
          provide: SyncEngineService,
          useValue: {
            forcePullSync: () => Promise.resolve(),
            fullSync: () => Promise.resolve()
          }
        }
      ],
      imports: [FieldsComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load farm details on init', () => {
    expect(component.farm).toBeDefined();
    expect(component.farm!.name).toBe('Sunrise Farm');
  });

  it('should initialize farm editing form when opening edit modal', () => {
    component.openEditFarmModal();
    expect(component.showEditFarmModal).toBeTrue();
    expect(component.editFarmName).toBe('Sunrise Farm');
    expect(component.editFarmLocation).toBe('Kerry, Ireland');
  });

  it('should call updateFarm and refresh farm details on submit', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'updateFarm').and.callThrough();
    spyOn(component, 'loadFarm').and.callThrough();

    component.openEditFarmModal();
    component.editFarmName = 'New Sunrise Farm';
    component.editFarmLocation = 'Cork, Ireland';

    component.editFarm();

    expect(farmService.updateFarm).toHaveBeenCalledWith(1, {
      name: 'New Sunrise Farm',
      location: 'Cork, Ireland'
    });
    expect(component.loadFarm).toHaveBeenCalled();
    expect(component.showEditFarmModal).toBeFalse();
  });

  it('should start inline editing with field details', () => {
    const field = { id: 42, farm_id: 1, name: 'South Paddock', area_hectares: 8.5 };
    component.startEdit(field);
    expect(component.editingFieldId).toBe(42);
    expect(component.editFieldName).toBe('South Paddock');
    expect(component.editFieldArea).toBe('8.5');
  });

  it('should clear editing state on cancel', () => {
    const field = { id: 42, farm_id: 1, name: 'South Paddock', area_hectares: 8.5 };
    component.startEdit(field);
    component.cancelEdit();
    expect(component.editingFieldId).toBeNull();
    expect(component.editFieldName).toBe('');
    expect(component.editFieldArea).toBe('');
  });

  it('should call updateField and refresh list on saveField', () => {
    const farmService = TestBed.inject(FarmManagementService);
    spyOn(farmService, 'updateField').and.callThrough();
    spyOn(component, 'loadFields').and.callThrough();

    const field = { id: 42, farm_id: 1, name: 'South Paddock', area_hectares: 8.5 };
    component.startEdit(field);
    component.editFieldName = 'Updated Paddock';
    component.editFieldArea = '9.2';
    component.editFieldLandUse = 'grassland';
    component.editFieldFarmId = 1;

    component.saveField(field);

    expect(farmService.updateField).toHaveBeenCalledWith(42, {
      id: 42,
      farm_id: 1,
      name: 'Updated Paddock',
      area_hectares: 9.2,
      land_use: 'grassland',
      geometry_wkt: undefined
    });
    expect(component.loadFields).toHaveBeenCalled();
    expect(component.editingFieldId).toBeNull();
  });
});
