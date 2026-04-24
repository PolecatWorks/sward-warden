import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherIntegrationComponent } from './weather-integration.component';

describe('WeatherIntegrationComponent', () => {
  let component: WeatherIntegrationComponent;
  let fixture: ComponentFixture<WeatherIntegrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
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
