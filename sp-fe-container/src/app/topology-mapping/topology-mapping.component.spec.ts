import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopologyMappingComponent } from './topology-mapping.component';

describe('TopologyMappingComponent', () => {
  let component: TopologyMappingComponent;
  let fixture: ComponentFixture<TopologyMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
