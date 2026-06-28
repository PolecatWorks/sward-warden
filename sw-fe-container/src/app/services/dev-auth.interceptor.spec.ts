import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

import { devAuthInterceptor } from './dev-auth.interceptor';

// PRD Reference: 0020
describe('devAuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // PRD Reference: 0020
  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue('real-test-token');

    TestBed.configureTestingModule({
      providers: [
        // PRD Reference: 0020
        provideHttpClient(withInterceptors([devAuthInterceptor])),
        // PRD Reference: 0020
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  // PRD Reference: 0020
  afterEach(() => {
    httpMock.verify();
  });

  // PRD Reference: 0020
  it('should add a fake JWT if Authorization header is missing', () => {
    httpClient.get('/test-endpoint').subscribe();

    const req = httpMock.expectOne('/test-endpoint');
    // PRD Reference: 0020
    expect(req.request.headers.has('Authorization')).toBeTrue();
    // PRD Reference: 0020
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer real-test-token',
    );

    req.flush({});
  });

  // PRD Reference: 0020
  it('should not add a fake JWT if Authorization header is present', () => {
    httpClient
      .get('/test-endpoint', {
        headers: { Authorization: 'Bearer real-token' },
      })
      .subscribe();

    const req = httpMock.expectOne('/test-endpoint');
    // PRD Reference: 0020
    expect(req.request.headers.get('Authorization')).toBe('Bearer real-token');
    req.flush({});
  });

  // PRD Reference: 0020
  it('should navigate to /error with correct state on 401 response', () => {
    httpClient.get('/test-endpoint').subscribe({
      next: () => fail('should have failed with 401'),
      error: (error: HttpErrorResponse) => {
        // PRD Reference: 0020
        expect(error.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/test-endpoint');
    req.flush(
      { error: 'Unauthorized Access' },
      { status: 401, statusText: 'Unauthorized' },
    );

    // PRD Reference: 0020
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/error'], {
      state: { error: 'Unauthorized Access' },
    });
  });

  // PRD Reference: 0020
  it('should navigate to /error with correct state on 403 response', () => {
    httpClient.get('/test-endpoint').subscribe({
      next: () => fail('should have failed with 403'),
      error: (error: HttpErrorResponse) => {
        // PRD Reference: 0020
        expect(error.status).toBe(403);
      },
    });

    const req = httpMock.expectOne('/test-endpoint');
    req.flush(
      { error: 'Forbidden Access' },
      { status: 403, statusText: 'Forbidden' },
    );

    // PRD Reference: 0020
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/error'], {
      state: { error: 'Forbidden Access' },
    });
  });

  // PRD Reference: 0020
  it('should navigate to /error with default message on 401/403 if no error message provided in response body', () => {
    httpClient.get('/test-endpoint').subscribe({
      next: () => fail('should have failed with 401'),
      error: (error: HttpErrorResponse) => {
        // PRD Reference: 0020
        expect(error.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/test-endpoint');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    // PRD Reference: 0020
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/error'], {
      state: {
        error:
          'Authentication failed. Please check your credentials or access rights.',
      },
    });
  });

  // PRD Reference: 0020
  it('should pass through other errors without navigation', () => {
    httpClient.get('/test-endpoint').subscribe({
      next: () => fail('should have failed with 500'),
      error: (error: HttpErrorResponse) => {
        // PRD Reference: 0020
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/test-endpoint');
    req.flush('Internal Server Error', {
      status: 500,
      statusText: 'Server Error',
    });

    // PRD Reference: 0020
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
