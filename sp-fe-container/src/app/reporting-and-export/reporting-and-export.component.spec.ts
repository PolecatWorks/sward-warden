import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingAndExportComponent } from './reporting-and-export.component';

describe('ReportingAndExportComponent', () => {
  let component: ReportingAndExportComponent;
  let fixture: ComponentFixture<ReportingAndExportComponent>;

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
