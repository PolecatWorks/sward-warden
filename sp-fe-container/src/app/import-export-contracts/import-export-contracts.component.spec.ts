import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportContractsComponent } from './import-export-contracts.component';

describe('ImportExportContractsComponent', () => {
  let component: ImportExportContractsComponent;
  let fixture: ComponentFixture<ImportExportContractsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [ImportExportContractsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExportContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
