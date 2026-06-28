import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { WeatherIntegrationComponent } from './weather-integration.component';
import { WeatherService } from '../services/weather.service';

// PRD Reference: 0008
describe('WeatherIntegrationComponent', () => {
  let component: WeatherIntegrationComponent;
  let fixture: ComponentFixture<WeatherIntegrationComponent>;

  // PRD Reference: 0008
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        // PRD Reference: 0008
        provideRouter([]),
        {
          provide: WeatherService,
          useValue: {
            getForecast: () => of([])
          }
        }
      ],
      imports: [WeatherIntegrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0008
  it('should create', () => {
    // PRD Reference: 0008
    expect(component).toBeTruthy();
  });
});
