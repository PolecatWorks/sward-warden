import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { GeneralFarmRecordsExportComponent } from './general-farm-records-export.component';

// PRD Reference: 0003
describe('GeneralFarmRecordsExportComponent', () => {
  let component: GeneralFarmRecordsExportComponent;
  let fixture: ComponentFixture<GeneralFarmRecordsExportComponent>;

  // PRD Reference: 0003
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [GeneralFarmRecordsExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralFarmRecordsExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0003
  it('should create', () => {
    // PRD Reference: 0003
    expect(component).toBeTruthy();
  });
});
