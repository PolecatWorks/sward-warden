import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimizationEngineComponent } from './optimization-engine.component';

describe('OptimizationEngineComponent', () => {
  let component: OptimizationEngineComponent;
  let fixture: ComponentFixture<OptimizationEngineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
