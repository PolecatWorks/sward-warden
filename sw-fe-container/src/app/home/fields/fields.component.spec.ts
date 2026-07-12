import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';

import { FieldsComponent } from './fields.component';
import { LoggerService } from '../../services/logger.service';
import { APP_CONFIG } from '../../app-config';
import { FarmManagementService } from '../../services/farm-management.service';
import { RxdbService } from '../../services/rxdb/rxdb.service';
import { AuthService } from '../../services/auth.service';
import { SyncEngineService } from '../../services/sync-engine.service';

// PRD Reference: 0003
describe('FieldsComponent', () => {
  let component: FieldsComponent;
  let fixture: ComponentFixture<FieldsComponent>;

  // PRD Reference: 0003
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        // PRD Reference: 0003
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { apiPath: "/api", logLevel: "DEBUG" } },
        LoggerService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'farmId' ? '1' : null),
            }),
            url: of([]),
          },
        },
        {
          provide: RxdbService,
          useValue: {
            fallbackToRest$: new BehaviorSubject<boolean>(false),
            db$: new BehaviorSubject<any>(null),
          },
        },
        {
          provide: FarmManagementService,
          useValue: {
            getFields: () => of([]),
            getFarms: () =>
              of([{ id: 1, name: 'Sunrise Farm', location: 'Kerry, Ireland' }]),
            getUser: () => of({ id: 1, name: 'Test User' }),
            addFarm: () => of({ id: 2 }),
            addField: () => of({}),
            deleteEntity: () => of({}),
            updateField: () => of({}),
            updateFarm: () =>
              of({ id: 1, name: 'Updated Farm', location: 'New Location' }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getUserId: () => '1',
          },
        },
        {
          provide: SyncEngineService,
          useValue: {
            forcePullSync: () => Promise.resolve(),
            fullSync: () => Promise.resolve(),
          },
        },
      ],
      imports: [FieldsComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0003
  it('should create', () => {
    // PRD Reference: 0003
    expect(component).toBeTruthy();
  });

  // PRD Reference: 0003
  it('should load farm details on init', () => {
    // PRD Reference: 0003
    expect(component.farm).toBeDefined();
    // PRD Reference: 0003
    expect(component.farm!.name).toBe('Sunrise Farm');
  });

  // PRD Reference: 0003
  it('should initialize farm editing form when opening edit modal', () => {
    component.openEditFarmModal();
    // PRD Reference: 0003
    expect(component.showEditFarmModal).toBeTrue();
    // PRD Reference: 0003
    expect(component.editFarmName).toBe('Sunrise Farm');
    // PRD Reference: 0003
    expect(component.editFarmLocation).toBe('Kerry, Ireland');
  });

  // PRD Reference: 0003
  it('should call updateFarm and refresh farm details on submit', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0003
    spyOn(farmService, 'updateFarm').and.callThrough();
    // PRD Reference: 0003
    spyOn(component, 'loadFarm').and.callThrough();

    component.openEditFarmModal();
    component.editFarmName = 'New Sunrise Farm';
    component.editFarmLocation = 'Cork, Ireland';

    component.editFarm();

    // PRD Reference: 0003
    expect(farmService.updateFarm).toHaveBeenCalledWith(1, {
      name: 'New Sunrise Farm',
      location: 'Cork, Ireland',
    });
    // PRD Reference: 0003
    expect(component.loadFarm).toHaveBeenCalled();
    // PRD Reference: 0003
    expect(component.showEditFarmModal).toBeFalse();
  });

  // PRD Reference: 0003


  // PRD Reference: 0003
  it('should clear editing state on cancel', () => {
    const field = {
      id: 42,
      farm_id: 1,
      name: 'South Paddock',
      area_hectares: 8.5,
    };
    component.startEdit(field);
    component.cancelEdit();
    // PRD Reference: 0003
    expect(component.editingFieldId).toBeNull();
    // PRD Reference: 0003
    expect(component.editFieldName).toBe('');
    // PRD Reference: 0003
    expect(component.editFieldArea).toBe('');
  });

  // PRD Reference: 0003
  it('should call updateField and refresh list on saveField', () => {
    const farmService = TestBed.inject(FarmManagementService);
    // PRD Reference: 0003
    spyOn(farmService, 'updateField').and.callThrough();
    // PRD Reference: 0003
    spyOn(component, 'loadFields').and.callThrough();

    const field = {
      id: 42,
      farm_id: 1,
      name: 'South Paddock',
      area_hectares: 8.5,
    };
    component.startEdit(field);
    component.editFieldName = 'Updated Paddock';
    component.editFieldArea = '9.2';
    component.editFieldLandUse = 'grassland';
    component.editFieldFarmId = 1;

    component.saveField(field);

    // PRD Reference: 0003
    expect(farmService.updateField).toHaveBeenCalledWith(42, {
      id: 42,
      farm_id: 1,
      name: 'Updated Paddock',
      area_hectares: 9.2,
      land_use: 'grassland',
      geometry_geojson: undefined
    });
    // PRD Reference: 0003
    expect(component.loadFields).toHaveBeenCalled();
    // PRD Reference: 0003
    expect(component.editingFieldId).toBeNull();
  });
});
