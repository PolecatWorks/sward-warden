import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { DigitalPesticideExportComponent } from './digital-pesticide-export.component';

// No obvious PRD requirement
describe('DigitalPesticideExportComponent', () => {
  let component: DigitalPesticideExportComponent;
  let fixture: ComponentFixture<DigitalPesticideExportComponent>;

  // No obvious PRD requirement
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

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
