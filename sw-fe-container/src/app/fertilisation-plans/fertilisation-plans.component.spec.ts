import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FertilisationPlansComponent } from './fertilisation-plans.component';

describe('FertilisationPlansComponent', () => {
  let component: FertilisationPlansComponent;
  let fixture: ComponentFixture<FertilisationPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FertilisationPlansComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FertilisationPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
