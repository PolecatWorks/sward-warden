import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OptimizationEngineComponent } from './optimization-engine.component';
import { OptimizationService } from '../services/optimization.service';
import { WeatherService } from '../services/weather.service';

describe('OptimizationEngineComponent', () => {
  let component: OptimizationEngineComponent;
  let fixture: ComponentFixture<OptimizationEngineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter([]),
        {
          provide: OptimizationService,
          useValue: {
            getSuggestions: () => of({ suggestions: [] })
          }
        },
        {
          provide: WeatherService,
          useValue: {
            getForecast: () => of([])
          }
        }
      ],
      imports: [OptimizationEngineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptimizationEngineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
