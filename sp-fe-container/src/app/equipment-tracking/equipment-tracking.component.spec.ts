import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { EquipmentTrackingComponent } from './equipment-tracking.component';

describe('EquipmentTrackingComponent', () => {
  let component: EquipmentTrackingComponent;
  let fixture: ComponentFixture<EquipmentTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [EquipmentTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
