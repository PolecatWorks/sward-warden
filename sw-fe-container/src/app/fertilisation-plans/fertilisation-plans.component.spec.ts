import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FertilisationPlansComponent } from './fertilisation-plans.component';
import { FarmManagementService } from '../services/farm-management.service';

describe('FertilisationPlansComponent', () => {
  let component: FertilisationPlansComponent;
  let fixture: ComponentFixture<FertilisationPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FertilisationPlansComponent, HttpClientTestingModule],
      providers: [
        {
          provide: FarmManagementService,
          useValue: {
            getFields: () => of([]),
            getFertilisationPlans: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FertilisationPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
