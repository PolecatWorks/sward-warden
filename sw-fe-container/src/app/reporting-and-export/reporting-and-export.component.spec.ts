import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ReportingAndExportComponent } from './reporting-and-export.component';

// No obvious PRD requirement
describe('ReportingAndExportComponent', () => {
  let component: ReportingAndExportComponent;
  let fixture: ComponentFixture<ReportingAndExportComponent>;

  // No obvious PRD requirement
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [ReportingAndExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportingAndExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
