import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { InventoryAndEquipmentComponent } from './inventory-and-equipment.component';

describe('InventoryAndEquipmentComponent', () => {
  let component: InventoryAndEquipmentComponent;
  let fixture: ComponentFixture<InventoryAndEquipmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [InventoryAndEquipmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryAndEquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
