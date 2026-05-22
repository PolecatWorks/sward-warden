import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { WeatherIntegrationComponent } from './weather-integration.component';
import { WeatherService } from '../services/weather.service';

describe('WeatherIntegrationComponent', () => {
  let component: WeatherIntegrationComponent;
  let fixture: ComponentFixture<WeatherIntegrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
