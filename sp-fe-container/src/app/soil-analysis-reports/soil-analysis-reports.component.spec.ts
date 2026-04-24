import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { SoilAnalysisReportsComponent } from './soil-analysis-reports.component';

describe('SoilAnalysisReportsComponent', () => {
  let component: SoilAnalysisReportsComponent;
  let fixture: ComponentFixture<SoilAnalysisReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [SoilAnalysisReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoilAnalysisReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
