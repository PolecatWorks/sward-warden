import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { SlurryDashboardComponent } from './slurry-dashboard.component';

describe('SlurryDashboardComponent', () => {
  let component: SlurryDashboardComponent;
  let fixture: ComponentFixture<SlurryDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [SlurryDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlurryDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
