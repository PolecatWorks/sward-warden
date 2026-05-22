import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SoilAnalysisResults } from './soil-analysis-results';
import { FarmManagementService } from '../services/farm-management.service';

describe('SoilAnalysisResults', () => {
  let component: SoilAnalysisResults;
  let fixture: ComponentFixture<SoilAnalysisResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoilAnalysisResults, HttpClientTestingModule],
      providers: [
        {
          provide: FarmManagementService,
          useValue: {
            getFields: () => of([]),
            getSoilAnalyses: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoilAnalysisResults);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
