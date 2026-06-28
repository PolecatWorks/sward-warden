import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TopologyMappingComponent } from './topology-mapping.component';
import { SpatialService } from '../services/spatial.service';

// PRD Reference: 0008
describe('TopologyMappingComponent', () => {
  let component: TopologyMappingComponent;
  let fixture: ComponentFixture<TopologyMappingComponent>;

  // PRD Reference: 0008
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
        // PRD Reference: 0008
        provideRouter([]),
        {
          provide: SpatialService,
          useValue: {
            getWaterwayBuffers: () => of({ type: 'FeatureCollection', features: [] })
          }
        }
      ],
      imports: [TopologyMappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopologyMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // PRD Reference: 0008
  it('should create', () => {
    // PRD Reference: 0008
    expect(component).toBeTruthy();
  });
});
