import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AnnualFertilisationAccountsComponent } from './annual-fertilisation-accounts.component';
import { FarmManagementService } from '../services/farm-management.service';

// No obvious PRD requirement
describe('AnnualFertilisationAccountsComponent', () => {
  let component: AnnualFertilisationAccountsComponent;
  let fixture: ComponentFixture<AnnualFertilisationAccountsComponent>;

  // No obvious PRD requirement
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        // No obvious PRD requirement
        provideRouter([]),
        {
          provide: FarmManagementService,
          useValue: {
            getFarmRecords: () => of([]),
            getFertiliserApplications: () => of([]),
          },
        },
      ],
      imports: [AnnualFertilisationAccountsComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnualFertilisationAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
