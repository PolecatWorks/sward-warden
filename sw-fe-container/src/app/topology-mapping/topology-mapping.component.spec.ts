import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TopologyMappingComponent } from './topology-mapping.component';
import { SpatialService } from '../services/spatial.service';

describe('TopologyMappingComponent', () => {
  let component: TopologyMappingComponent;
  let fixture: ComponentFixture<TopologyMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
