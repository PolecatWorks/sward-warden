import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { InventoryAndEquipmentComponent } from './inventory-and-equipment.component';

// PRD Reference: 0006
describe('InventoryAndEquipmentComponent', () => {
  let component: InventoryAndEquipmentComponent;
  let fixture: ComponentFixture<InventoryAndEquipmentComponent>;

  // PRD Reference: 0006
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [InventoryAndEquipmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryAndEquipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0006
  it('should create', () => {
    // PRD Reference: 0006
    expect(component).toBeTruthy();
  });
});
