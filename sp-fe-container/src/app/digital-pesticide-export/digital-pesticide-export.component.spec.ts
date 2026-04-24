import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalPesticideExportComponent } from './digital-pesticide-export.component';

describe('DigitalPesticideExportComponent', () => {
  let component: DigitalPesticideExportComponent;
  let fixture: ComponentFixture<DigitalPesticideExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [DigitalPesticideExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalPesticideExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
