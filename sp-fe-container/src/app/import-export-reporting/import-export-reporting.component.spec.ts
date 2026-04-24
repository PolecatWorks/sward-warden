import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ImportExportReportingComponent } from './import-export-reporting.component';

describe('ImportExportReportingComponent', () => {
  let component: ImportExportReportingComponent;
  let fixture: ComponentFixture<ImportExportReportingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [ImportExportReportingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExportReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
