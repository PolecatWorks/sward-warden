import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageCapacityComponent } from './storage-capacity.component';

describe('StorageCapacityComponent', () => {
  let component: StorageCapacityComponent;
  let fixture: ComponentFixture<StorageCapacityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [StorageCapacityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageCapacityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
