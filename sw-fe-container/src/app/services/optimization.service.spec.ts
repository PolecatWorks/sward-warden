import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_CONFIG } from '../app-config';

import { OptimizationService } from './optimization.service';

describe('OptimizationService', () => {
  let service: OptimizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiPath: '/api', logLevel: 'INFO' } }
      ]
    });
    service = TestBed.inject(OptimizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
