import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { StorageCapacityComponent } from './storage-capacity.component';
import { of } from 'rxjs';

// No obvious PRD requirement
describe('StorageCapacityComponent', () => {
  let component: StorageCapacityComponent;
  let fixture: ComponentFixture<StorageCapacityComponent>;

  // No obvious PRD requirement
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map()),
            url: of([])
          }
        },
        provideRouter([])
      ],
      imports: [StorageCapacityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageCapacityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // No obvious PRD requirement
  it('should create', () => {
    // No obvious PRD requirement
    expect(component).toBeTruthy();
  });
});
