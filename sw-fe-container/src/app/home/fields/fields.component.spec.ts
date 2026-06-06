import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { FieldsComponent } from './fields.component';
import { FarmManagementService } from '../../services/farm-management.service';

describe('FieldsComponent', () => {
  let component: FieldsComponent;
  let fixture: ComponentFixture<FieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
        provideRouter([]),
        {
          provide: FarmManagementService,
          useValue: {
            getFields: () => of([]),
            addField: () => of({}),
            deleteEntity: () => of({}),
            updateField: () => of({})
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

    component.saveField(field);

    expect(farmService.updateField).toHaveBeenCalledWith(42, {
      id: 42,
      farm_id: 1,
      name: 'Updated Paddock',
      area_hectares: 9.2
    });
    expect(component.loadFields).toHaveBeenCalled();
    expect(component.editingFieldId).toBeNull();
  });
});
