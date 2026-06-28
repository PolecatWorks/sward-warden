import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChemicalPesticideInventoryComponent } from './chemical-pesticide-inventory.component';
import { APP_CONFIG } from '../app-config';

describe('ChemicalPesticideInventoryComponent', () => {
  let component: ChemicalPesticideInventoryComponent;
  let fixture: ComponentFixture<ChemicalPesticideInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { apiPath: '/v0' } }
      ],
      imports: [ChemicalPesticideInventoryComponent, HttpClientTestingModule]
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
