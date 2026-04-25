import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FarmManagementService } from './farm-management.service';
import { Farm } from '../models/farm';
import { AuthService } from './auth.service';

const mockFarms: Farm[] = [
  { id: 1, user_id: 1, name: 'Sunrise Farm', location: 'Kerry, Ireland' },
  { id: 2, user_id: 1, name: 'Millbrook Farm', location: 'Cork, Ireland' },
];

describe('FarmManagementService', () => {
  let service: FarmManagementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FarmManagementService,
        {
          provide: AuthService,
          useValue: { getUserId: () => 'test-user' }
        }
      ],
    });
    service = TestBed.inject(FarmManagementService);
    httpMock = TestBed.inject(HttpTestingController);

    // Force the config request to be made
    service['apiUrl$'].subscribe();

    // Handle the config.json request made
    const configReq = httpMock.expectOne((req) => req.url.endsWith('config.json'));
    configReq.flush({ apiUrl: '/v0' });
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getFarms ──────────────────────────────────────────────
  describe('getFarms', () => {
    it('should GET /v0/farms and return list of farms', () => {
      let result: Farm[] | undefined;
      service.getFarms().subscribe((farms) => (result = farms));

      const req = httpMock.expectOne('/v0/farms');
      expect(req.request.method).toBe('GET');
      req.flush(mockFarms);

      expect(result).toEqual(mockFarms);
    });

    it('should return an empty array when the server returns no farms', () => {
      let result: Farm[] | undefined;
      service.getFarms().subscribe((farms) => (result = farms));

      const req = httpMock.expectOne('/v0/farms');
      req.flush([]);

      expect(result).toEqual([]);
    });
  });

  // ── addFarm ───────────────────────────────────────────────
  describe('addFarm', () => {
    it('should POST to /v0/farms with farm name and location', () => {
      const newFarm: Farm = { name: 'New Farm', location: 'Galway, Ireland' };
      const serverResponse: Farm = { id: 3, user_id: 1, name: 'New Farm', location: 'Galway, Ireland' };

      let result: Farm | undefined;
      service.addFarm(newFarm).subscribe((farm) => (result = farm));

      const req = httpMock.expectOne('/v0/farms');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newFarm);
      req.flush(serverResponse);

      expect(result).toEqual(serverResponse);
    });

    it('should not include a client-generated id in the POST body', () => {
      const newFarm: Farm = { name: 'Client Farm', location: 'Dublin, Ireland' };
      service.addFarm(newFarm).subscribe();

      const req = httpMock.expectOne('/v0/farms');
      expect(req.request.body.id).toBeUndefined();
      req.flush({ id: 99, user_id: 1, ...newFarm });
    });

    it('should return the created farm with a server-assigned id', () => {
      const newFarm: Farm = { name: 'My Farm', location: 'Limerick, Ireland' };
      const serverResponse: Farm = { id: 5, user_id: 1, name: 'My Farm', location: 'Limerick, Ireland' };

      let result: Farm | undefined;
      service.addFarm(newFarm).subscribe((f) => (result = f));

      const req = httpMock.expectOne('/v0/farms');
      req.flush(serverResponse);

      expect(result?.id).toBe(5);
    });
  });

  // ── deleteFarm ────────────────────────────────────────────
  describe('deleteFarm', () => {
    it('should DELETE /v0/farms/:id', () => {
      service.deleteFarm(1).subscribe();

      const req = httpMock.expectOne('/v0/farms/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should DELETE the correct farm by id', () => {
      service.deleteFarm(42).subscribe();

      const req = httpMock.expectOne('/v0/farms/42');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
