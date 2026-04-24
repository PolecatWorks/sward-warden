import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ComplianceTrackingComponent } from './compliance-tracking.component';

describe('ComplianceTrackingComponent', () => {
  let component: ComplianceTrackingComponent;
  let fixture: ComponentFixture<ComplianceTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [ComplianceTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplianceTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
