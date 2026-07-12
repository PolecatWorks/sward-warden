import { LoggerService } from '../services/logger.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChemicalPesticideInventoryComponent } from './chemical-pesticide-inventory.component';
import { APP_CONFIG } from '../app-config';

// PRD Reference: 0006
describe('ChemicalPesticideInventoryComponent', () => {
  let component: ChemicalPesticideInventoryComponent;
  let fixture: ComponentFixture<ChemicalPesticideInventoryComponent>;

  // PRD Reference: 0006
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        // PRD Reference: 0006
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { apiPath: "/v0", logLevel: "DEBUG" } },
        LoggerService,
      ],
      imports: [ChemicalPesticideInventoryComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChemicalPesticideInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0006
  it('should create', () => {
    // PRD Reference: 0006
    expect(component).toBeTruthy();
  });
});
