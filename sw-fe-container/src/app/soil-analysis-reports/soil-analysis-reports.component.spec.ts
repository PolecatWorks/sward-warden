import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { SoilAnalysisReportsComponent } from './soil-analysis-reports.component';

// No obvious PRD requirement
describe('SoilAnalysisReportsComponent', () => {
  let component: SoilAnalysisReportsComponent;
  let fixture: ComponentFixture<SoilAnalysisReportsComponent>;

  // No obvious PRD requirement
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [SoilAnalysisReportsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SoilAnalysisReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
