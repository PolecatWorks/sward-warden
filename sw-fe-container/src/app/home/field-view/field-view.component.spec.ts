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
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
        provideRouter([]),
        {
          provide: FarmManagementService,
          useValue: {
            getField: () => of({ id: 1, name: 'Test Field' }),
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
});
