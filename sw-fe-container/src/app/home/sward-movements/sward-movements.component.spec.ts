import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SwardMovementsComponent } from './sward-movements.component';

describe('SwardMovementsComponent', () => {
  let component: SwardMovementsComponent;
  let fixture: ComponentFixture<SwardMovementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwardMovementsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' }),
            snapshot: { paramMap: { get: () => '1' } },
            paramMap: of({ get: () => '1' })
          }
        },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwardMovementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
