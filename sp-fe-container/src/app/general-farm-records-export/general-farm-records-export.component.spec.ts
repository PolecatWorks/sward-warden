import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { GeneralFarmRecordsExportComponent } from './general-farm-records-export.component';

describe('GeneralFarmRecordsExportComponent', () => {
  let component: GeneralFarmRecordsExportComponent;
  let fixture: ComponentFixture<GeneralFarmRecordsExportComponent>;

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
