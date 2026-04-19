import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterwayProtectionComponent } from './waterway-protection.component';

describe('WaterwayProtectionComponent', () => {
  let component: WaterwayProtectionComponent;
  let fixture: ComponentFixture<WaterwayProtectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterwayProtectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterwayProtectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
