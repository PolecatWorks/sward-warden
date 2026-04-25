import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AnnualFertilisationAccountsComponent } from './annual-fertilisation-accounts.component';

describe('AnnualFertilisationAccountsComponent', () => {
  let component: AnnualFertilisationAccountsComponent;
  let fixture: ComponentFixture<AnnualFertilisationAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [AnnualFertilisationAccountsComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnualFertilisationAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
