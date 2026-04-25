import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoilAnalysisResults } from './soil-analysis-results';

describe('SoilAnalysisResults', () => {
  let component: SoilAnalysisResults;
  let fixture: ComponentFixture<SoilAnalysisResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoilAnalysisResults, HttpClientTestingModule]
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
