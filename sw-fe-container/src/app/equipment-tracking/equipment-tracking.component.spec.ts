import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { EquipmentTrackingComponent } from './equipment-tracking.component';

// No obvious PRD requirement
describe('EquipmentTrackingComponent', () => {
  let component: EquipmentTrackingComponent;
  let fixture: ComponentFixture<EquipmentTrackingComponent>;

  // No obvious PRD requirement
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [EquipmentTrackingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
