import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AnnualFertilisationAccountsComponent } from './annual-fertilisation-accounts.component';
import { FarmManagementService } from '../services/farm-management.service';

describe('AnnualFertilisationAccountsComponent', () => {
  let component: AnnualFertilisationAccountsComponent;
  let fixture: ComponentFixture<AnnualFertilisationAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        {
          provide: FarmManagementService,
          useValue: {
            getFarmRecords: () => of([]),
            getFertiliserApplications: () => of([])
          }
        }
      ],
      imports: [AnnualFertilisationAccountsComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnualFertilisationAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
