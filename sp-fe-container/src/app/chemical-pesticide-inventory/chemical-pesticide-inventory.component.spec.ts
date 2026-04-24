import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ChemicalPesticideInventoryComponent } from './chemical-pesticide-inventory.component';

describe('ChemicalPesticideInventoryComponent', () => {
  let component: ChemicalPesticideInventoryComponent;
  let fixture: ComponentFixture<ChemicalPesticideInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [ChemicalPesticideInventoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChemicalPesticideInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
