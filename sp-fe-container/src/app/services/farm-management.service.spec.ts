import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FarmManagementService } from './farm-management.service';

describe('FarmManagementService', () => {
  let service: FarmManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(FarmManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
